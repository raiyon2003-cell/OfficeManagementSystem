import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { StationeryItemStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, paginated, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  parseSearchParams,
  resolveParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import {
  createStationeryItemSchema,
  listStationeryItemsSchema,
  updateStationeryItemSchema,
} from "@/lib/validations/stationery";
import { logActivity, logAudit } from "@/lib/services/audit.service";

function resolveStationeryStatus(
  currentStock: number,
  reorderLevel: number,
): StationeryItemStatus {
  if (currentStock <= 0) return StationeryItemStatus.OUT_OF_STOCK;
  if (currentStock <= reorderLevel) return StationeryItemStatus.LOW_STOCK;
  return StationeryItemStatus.ACTIVE;
}

export const GET = withPermission(
  PERMISSIONS.STATIONERY_READ,
  async (request) => {
    const parsed = parseSearchParams(request, listStationeryItemsSchema);
    if (!parsed.success) return parsed.response;

    const { page, limit, search, sortBy, sortOrder, lowStock, status } =
      parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.StationeryItemWhereInput = {
      isActive: true,
      ...(status ? { status } : {}),
      ...(lowStock
        ? {
            status: {
              in: [StationeryItemStatus.LOW_STOCK, StationeryItemStatus.OUT_OF_STOCK],
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.StationeryItemOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { name: "asc" };

    const [items, total] = await Promise.all([
      prisma.stationeryItem.findMany({ where, skip, take: limit, orderBy }),
      prisma.stationeryItem.count({ where }),
    ]);

    return paginated(items, { page, limit, total });
  },
);

export const POST = withPermission(
  PERMISSIONS.STATIONERY_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createStationeryItemSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const existing = await prisma.stationeryItem.findUnique({
      where: { sku: parsed.data.sku },
    });
    if (existing) {
      return error("SKU already exists", { code: "SKU_EXISTS", status: 409 });
    }

    const status =
      parsed.data.status ??
      resolveStationeryStatus(parsed.data.currentStock, parsed.data.reorderLevel);

    const item = await prisma.stationeryItem.create({
      data: { ...parsed.data, status },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "stationery_items",
      recordId: item.id,
      ipAddress: ip,
    });

    return success(item, { message: "Stationery item created", status: 201 });
  },
);

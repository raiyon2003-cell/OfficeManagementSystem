import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { StationeryItemStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, paginated, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import {
  createStationeryIssuanceSchema,
  listStationeryIssuanceSchema,
} from "@/lib/validations/stationery";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(
  PERMISSIONS.STATIONERY_READ,
  async (request) => {
    const parsed = parseSearchParams(request, listStationeryIssuanceSchema);
    if (!parsed.success) return parsed.response;

    const { page, limit, sortOrder, itemId, employeeId, dateFrom, dateTo } =
      parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.StationeryIssuanceWhereInput = {
      ...(itemId ? { itemId } : {}),
      ...(employeeId ? { employeeId } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    };

    const [issuances, total] = await Promise.all([
      prisma.stationeryIssuance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: {
          item: { select: { id: true, name: true, sku: true } },
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          issuedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.stationeryIssuance.count({ where }),
    ]);

    return paginated(issuances, { page, limit, total });
  },
);

export const POST = withPermission(
  PERMISSIONS.STATIONERY_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createStationeryIssuanceSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const { itemId, employeeId, quantity, purpose } = parsed.data;

    const item = await prisma.stationeryItem.findFirst({
      where: { id: itemId, isActive: true },
    });

    if (!item) {
      return error("Item not found", { code: "NOT_FOUND", status: 404 });
    }

    if (item.currentStock < quantity) {
      return error("Insufficient stock", { code: "INSUFFICIENT_STOCK", status: 400 });
    }

    const employee = await prisma.user.findFirst({
      where: { id: employeeId, isActive: true, deletedAt: null },
    });

    if (!employee) {
      return error("Employee not found", { code: "EMPLOYEE_NOT_FOUND", status: 400 });
    }

    const newStock = item.currentStock - quantity;
    const status =
      newStock <= 0
        ? StationeryItemStatus.OUT_OF_STOCK
        : newStock <= item.reorderLevel
          ? StationeryItemStatus.LOW_STOCK
          : StationeryItemStatus.ACTIVE;

    const issuance = await prisma.$transaction(async (tx) => {
      const record = await tx.stationeryIssuance.create({
        data: {
          itemId,
          employeeId,
          quantity,
          purpose,
          issuedById: user.id,
        },
        include: {
          item: true,
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      await tx.stationeryItem.update({
        where: { id: itemId },
        data: { currentStock: newStock, status },
      });

      return record;
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "stationery_issuance",
      recordId: issuance.id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "ISSUE_STATIONERY",
      module: "stationery",
      entityType: "StationeryIssuance",
      entityId: issuance.id,
      ipAddress: ip,
    });

    return success(issuance, { message: "Stationery issued", status: 201 });
  },
);

import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { InventoryItemStatus } from "@/generated/prisma/client";
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
  createInventoryItemSchema,
  listInventoryItemsSchema,
} from "@/lib/validations/inventory";
import { logActivity, logAudit } from "@/lib/services/audit.service";

function resolveItemStatus(
  currentStock: number,
  reorderLevel: number,
): InventoryItemStatus {
  if (currentStock <= 0) return InventoryItemStatus.OUT_OF_STOCK;
  if (currentStock <= reorderLevel) return InventoryItemStatus.LOW_STOCK;
  return InventoryItemStatus.ACTIVE;
}

export const GET = withPermission(
  PERMISSIONS.INVENTORY_READ,
  async (request) => {
    const parsed = parseSearchParams(request, listInventoryItemsSchema);
    if (!parsed.success) return parsed.response;

    const { page, limit, search, sortBy, sortOrder, categoryId, lowStock, status } =
      parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryItemWhereInput = {
      deletedAt: null,
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(status ? { status } : {}),
      ...(lowStock
        ? { status: { in: [InventoryItemStatus.LOW_STOCK, InventoryItemStatus.OUT_OF_STOCK] } }
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

    const orderBy: Prisma.InventoryItemOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { name: "asc" };

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          vendor: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return paginated(items, { page, limit, total });
  },
);

export const POST = withPermission(
  PERMISSIONS.INVENTORY_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createInventoryItemSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const existing = await prisma.inventoryItem.findUnique({
      where: { sku: parsed.data.sku },
    });
    if (existing) {
      return error("SKU already exists", { code: "SKU_EXISTS", status: 409 });
    }

    const status =
      parsed.data.status ??
      resolveItemStatus(parsed.data.currentStock, parsed.data.reorderLevel);

    const item = await prisma.inventoryItem.create({
      data: { ...parsed.data, status },
      include: { category: true },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "inventory_items",
      recordId: item.id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CREATE_INVENTORY_ITEM",
      module: "inventory",
      entityType: "InventoryItem",
      entityId: item.id,
      ipAddress: ip,
    });

    return success(item, { message: "Item created", status: 201 });
  },
);

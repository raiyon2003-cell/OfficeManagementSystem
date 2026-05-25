import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import {
  InventoryItemStatus,
  StockMovementType,
} from "@/generated/prisma/client";
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
  createStockMovementSchema,
  listStockMovementsSchema,
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
    const parsed = parseSearchParams(request, listStockMovementsSchema);
    if (!parsed.success) return parsed.response;

    const { page, limit, sortOrder, itemId, type, dateFrom, dateTo } =
      parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = {
      ...(itemId ? { itemId } : {}),
      ...(type ? { type } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    };

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: {
          item: { select: { id: true, name: true, sku: true } },
          performedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return paginated(movements, { page, limit, total });
  },
);

export const POST = withPermission(
  PERMISSIONS.INVENTORY_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createStockMovementSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const { itemId, type, quantity, reason, reference } = parsed.data;

    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, deletedAt: null, isActive: true },
    });

    if (!item) {
      return error("Item not found", { code: "NOT_FOUND", status: 404 });
    }

    let newStock = item.currentStock;
    if (type === StockMovementType.IN) {
      newStock += quantity;
    } else if (type === StockMovementType.OUT) {
      if (item.currentStock < quantity) {
        return error("Insufficient stock", { code: "INSUFFICIENT_STOCK", status: 400 });
      }
      newStock -= quantity;
    } else {
      newStock = quantity;
    }

    const status = resolveItemStatus(newStock, item.reorderLevel);

    const movement = await prisma.$transaction(async (tx) => {
      const m = await tx.stockMovement.create({
        data: {
          itemId,
          type,
          quantity,
          reason,
          reference,
          performedById: user.id,
        },
        include: {
          item: { select: { id: true, name: true, sku: true } },
        },
      });

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { currentStock: newStock, status },
      });

      return m;
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "stock_movements",
      recordId: movement.id,
      newValues: { itemId, type, quantity },
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "STOCK_MOVEMENT",
      module: "inventory",
      entityType: "StockMovement",
      entityId: movement.id,
      ipAddress: ip,
    });

    return success(movement, { message: "Stock movement recorded", status: 201 });
  },
);

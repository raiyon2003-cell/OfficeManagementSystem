import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  resolveParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { updateInventoryItemSchema } from "@/lib/validations/inventory";
import { InventoryItemStatus } from "@/generated/prisma/client";
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
  async (_request, { params }) => {
    const { id } = await resolveParams(params);

    const item = await prisma.inventoryItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        vendor: true,
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            performedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!item) {
      return error("Item not found", { code: "NOT_FOUND", status: 404 });
    }

    return success(item);
  },
);

export const PATCH = withPermission(
  PERMISSIONS.INVENTORY_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, updateInventoryItemSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return error("Item not found", { code: "NOT_FOUND", status: 404 });
    }

    const currentStock = parsed.data.currentStock ?? existing.currentStock;
    const reorderLevel = parsed.data.reorderLevel ?? existing.reorderLevel;
    const status =
      parsed.data.status ?? resolveItemStatus(currentStock, reorderLevel);

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { ...parsed.data, status },
      include: { category: true },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      tableName: "inventory_items",
      recordId: id,
      ipAddress: ip,
    });

    return success(item, { message: "Item updated" });
  },
);

export const DELETE = withPermission(
  PERMISSIONS.INVENTORY_WRITE,
  async (request, { user, params }) => {
    const { id } = await resolveParams(params);
    const ip = getClientIp(request);

    const existing = await prisma.inventoryItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return error("Item not found", { code: "NOT_FOUND", status: 404 });
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await logAudit({
      userId: user.id,
      action: "SOFT_DELETE",
      tableName: "inventory_items",
      recordId: id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "DELETE_INVENTORY_ITEM",
      module: "inventory",
      entityType: "InventoryItem",
      entityId: id,
      ipAddress: ip,
    });

    return success({ deleted: true }, { message: "Item deleted" });
  },
);

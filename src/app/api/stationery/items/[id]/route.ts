import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { getClientIp, parseJsonBody, resolveParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { updateStationeryItemSchema } from "@/lib/validations/stationery";
import { StationeryItemStatus } from "@/generated/prisma/client";
import { logAudit } from "@/lib/services/audit.service";

function resolveStationeryStatus(
  currentStock: number,
  reorderLevel: number,
): StationeryItemStatus {
  if (currentStock <= 0) return StationeryItemStatus.OUT_OF_STOCK;
  if (currentStock <= reorderLevel) return StationeryItemStatus.LOW_STOCK;
  return StationeryItemStatus.ACTIVE;
}

export const PATCH = withPermission(
  PERMISSIONS.STATIONERY_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, updateStationeryItemSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const existing = await prisma.stationeryItem.findFirst({
      where: { id, isActive: true },
    });

    if (!existing) {
      return error("Item not found", { code: "NOT_FOUND", status: 404 });
    }

    const currentStock = parsed.data.currentStock ?? existing.currentStock;
    const reorderLevel = parsed.data.reorderLevel ?? existing.reorderLevel;
    const status =
      parsed.data.status ?? resolveStationeryStatus(currentStock, reorderLevel);

    const item = await prisma.stationeryItem.update({
      where: { id },
      data: { ...parsed.data, status },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      tableName: "stationery_items",
      recordId: id,
      ipAddress: ip,
    });

    return success(item, { message: "Stationery item updated" });
  },
);

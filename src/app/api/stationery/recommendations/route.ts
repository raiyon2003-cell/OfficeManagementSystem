import { StationeryItemStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api-response";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";

export const GET = withPermission(PERMISSIONS.STATIONERY_READ, async () => {
  const lowStockItems = await prisma.stationeryItem.findMany({
    where: {
      isActive: true,
      status: {
        in: [StationeryItemStatus.LOW_STOCK, StationeryItemStatus.OUT_OF_STOCK],
      },
    },
    orderBy: { currentStock: "asc" },
  });

  const recommendations = lowStockItems.map((item) => {
    const suggestedQuantity = Math.max(
      item.reorderLevel * 2 - item.currentStock,
      item.reorderLevel,
    );

    return {
      itemId: item.id,
      sku: item.sku,
      name: item.name,
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      suggestedOrderQuantity: suggestedQuantity,
      estimatedCost: Number(item.unitPrice) * suggestedQuantity,
      priority:
        item.status === StationeryItemStatus.OUT_OF_STOCK ? "HIGH" : "MEDIUM",
    };
  });

  return success({
    count: recommendations.length,
    totalEstimatedCost: recommendations.reduce(
      (sum, r) => sum + r.estimatedCost,
      0,
    ),
    recommendations,
  });
});

import { InventoryItemStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api-response";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";

export const GET = withPermission(PERMISSIONS.INVENTORY_READ, async () => {
  const alerts = await prisma.inventoryItem.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      status: {
        in: [InventoryItemStatus.LOW_STOCK, InventoryItemStatus.OUT_OF_STOCK],
      },
    },
    orderBy: { currentStock: "asc" },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return success({
    count: alerts.length,
    alerts: alerts.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      minStockLevel: item.minStockLevel,
      status: item.status,
      category: item.category,
    })),
  });
});

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api-response";
import { getClientIp, parseJsonBody } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { createInventoryCategorySchema } from "@/lib/validations/inventory";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(PERMISSIONS.INVENTORY_READ, async () => {
  const categories = await prisma.inventoryCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return success(categories);
});

export const POST = withPermission(
  PERMISSIONS.INVENTORY_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createInventoryCategorySchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const category = await prisma.inventoryCategory.create({ data: parsed.data });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "inventory_categories",
      recordId: category.id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CREATE_INVENTORY_CATEGORY",
      module: "inventory",
      entityType: "InventoryCategory",
      entityId: category.id,
      ipAddress: ip,
    });

    return success(category, { message: "Category created", status: 201 });
  },
);

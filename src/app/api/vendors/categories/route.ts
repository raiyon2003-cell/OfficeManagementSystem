import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api-response";
import { getClientIp, parseJsonBody } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { createVendorCategorySchema } from "@/lib/validations/vendors";
import { logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(PERMISSIONS.VENDORS_READ, async () => {
  const categories = await prisma.vendorCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { vendors: true } } },
  });
  return success(categories);
});

export const POST = withPermission(
  PERMISSIONS.VENDORS_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createVendorCategorySchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const category = await prisma.vendorCategory.create({ data: parsed.data });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "vendor_categories",
      recordId: category.id,
      ipAddress: ip,
    });

    return success(category, { message: "Category created", status: 201 });
  },
);

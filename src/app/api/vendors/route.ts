import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
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
  createVendorSchema,
  listVendorsSchema,
} from "@/lib/validations/vendors";
import { logActivity, logAudit } from "@/lib/services/audit.service";

function generateVendorCode() {
  return `VND-${Date.now().toString(36).toUpperCase()}`;
}

export const GET = withPermission(PERMISSIONS.VENDORS_READ, async (request) => {
  const parsed = parseSearchParams(request, listVendorsSchema);
  if (!parsed.success) return parsed.response;

  const { page, limit, search, sortBy, sortOrder, categoryId, status } =
    parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.VendorWhereInput = {
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.VendorOrderByWithRelationInput = sortBy
    ? { [sortBy]: sortOrder }
    : { name: "asc" };

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { category: true },
    }),
    prisma.vendor.count({ where }),
  ]);

  return paginated(vendors, { page, limit, total });
});

export const POST = withPermission(
  PERMISSIONS.VENDORS_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createVendorSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);

    let defaultCategory = parsed.data.categoryId
      ? null
      : await prisma.vendorCategory.findFirst({ orderBy: { name: "asc" } });

    if (!parsed.data.categoryId && !defaultCategory) {
      defaultCategory = await prisma.vendorCategory.create({
        data: { name: "General", description: "Auto-created default category" },
      });
    }

    let code = parsed.data.code ?? generateVendorCode();
    while (await prisma.vendor.findUnique({ where: { code } })) {
      code = generateVendorCode();
    }

    const vendor = await prisma.vendor.create({
      data: {
        ...parsed.data,
        code,
        categoryId: parsed.data.categoryId ?? defaultCategory!.id,
      },
      include: { category: true },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "vendors",
      recordId: vendor.id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CREATE_VENDOR",
      module: "vendors",
      entityType: "Vendor",
      entityId: vendor.id,
      ipAddress: ip,
    });

    return success(vendor, { message: "Vendor created", status: 201 });
  },
);

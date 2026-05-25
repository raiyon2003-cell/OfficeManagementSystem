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
    const existing = await prisma.vendor.findUnique({
      where: { code: parsed.data.code },
    });
    if (existing) {
      return error("Vendor code already exists", { code: "CODE_EXISTS", status: 409 });
    }

    const vendor = await prisma.vendor.create({
      data: parsed.data,
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

import type { NextRequest } from "next/server";
import { VendorStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { getClientIp, parseJsonBody, resolveParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { updateVendorSchema } from "@/lib/validations/vendors";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(
  PERMISSIONS.VENDORS_READ,
  async (_request, { params }) => {
    const { id } = await resolveParams(params);

    const vendor = await prisma.vendor.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        inventoryItems: {
          where: { deletedAt: null },
          take: 20,
          select: { id: true, name: true, sku: true, currentStock: true },
        },
        purchaseRequests: {
          where: { deletedAt: null },
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            requestNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!vendor) {
      return error("Vendor not found", { code: "NOT_FOUND", status: 404 });
    }

    return success(vendor);
  },
);

export const PATCH = withPermission(
  PERMISSIONS.VENDORS_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, updateVendorSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const existing = await prisma.vendor.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return error("Vendor not found", { code: "NOT_FOUND", status: 404 });
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      tableName: "vendors",
      recordId: id,
      ipAddress: ip,
    });

    return success(vendor, { message: "Vendor updated" });
  },
);

export const DELETE = withPermission(
  PERMISSIONS.VENDORS_WRITE,
  async (request, { user, params }) => {
    const { id } = await resolveParams(params);
    const ip = getClientIp(request);

    const existing = await prisma.vendor.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return error("Vendor not found", { code: "NOT_FOUND", status: 404 });
    }

    await prisma.vendor.update({
      where: { id },
      data: { deletedAt: new Date(), status: VendorStatus.INACTIVE },
    });

    await logAudit({
      userId: user.id,
      action: "SOFT_DELETE",
      tableName: "vendors",
      recordId: id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "DELETE_VENDOR",
      module: "vendors",
      entityType: "Vendor",
      entityId: id,
      ipAddress: ip,
    });

    return success({ deleted: true }, { message: "Vendor deleted" });
  },
);

import type { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  resolveParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { updatePurchaseRequestSchema } from "@/lib/validations/purchase-requests";
import { ApprovalEntityType } from "@/generated/prisma/client";
import { logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(
  PERMISSIONS.PURCHASE_READ,
  async (_request, { params }) => {
    const { id } = await resolveParams(params);

    const purchaseRequest = await prisma.purchaseRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        vendor: true,
      },
    });

    if (!purchaseRequest) {
      return error("Purchase request not found", { code: "NOT_FOUND", status: 404 });
    }

    const approvals = await prisma.approval.findMany({
      where: {
        entityType: ApprovalEntityType.PURCHASE_REQUEST,
        entityId: id,
      },
      include: {
        approver: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success({ ...purchaseRequest, approvals });
  },
);

export const PATCH = withPermission(
  PERMISSIONS.PURCHASE_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, updatePurchaseRequestSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const existing = await prisma.purchaseRequest.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });

    if (!existing) {
      return error("Purchase request not found", { code: "NOT_FOUND", status: 404 });
    }

    const { items, ...updateData } = parsed.data;
    let totalAmount: Prisma.Decimal = existing.totalAmount;

    if (items) {
      totalAmount = new Prisma.Decimal(
        items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      );
    }

    const purchaseRequest = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.purchaseRequestItem.deleteMany({
          where: { purchaseRequestId: id },
        });
      }

      return tx.purchaseRequest.update({
        where: { id },
        data: {
          ...updateData,
          totalAmount,
          ...(items ? { items: { create: items } } : {}),
        },
        include: { items: true, vendor: true },
      });
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      tableName: "purchase_requests",
      recordId: id,
      ipAddress: ip,
    });

    return success(purchaseRequest, { message: "Purchase request updated" });
  },
);

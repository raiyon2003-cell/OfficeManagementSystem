import type { NextRequest } from "next/server";
import {
  ApprovalEntityType,
  ApprovalStatus,
  PurchaseRequestStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { getClientIp, parseJsonBody, resolveParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { approvePurchaseRequestSchema } from "@/lib/validations/purchase-requests";
import { logActivity, logAudit } from "@/lib/services/audit.service";
import { createNotification } from "@/lib/services/notification.service";

export const POST = withPermission(
  PERMISSIONS.PURCHASE_APPROVE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, approvePurchaseRequestSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const purchaseRequest = await prisma.purchaseRequest.findFirst({
      where: { id, deletedAt: null },
    });

    if (!purchaseRequest) {
      return error("Purchase request not found", { code: "NOT_FOUND", status: 404 });
    }

    if (purchaseRequest.status !== PurchaseRequestStatus.PENDING) {
      return error("Purchase request is not pending", {
        code: "INVALID_STATUS",
        status: 400,
      });
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: { status: PurchaseRequestStatus.APPROVED },
    });

    await prisma.approval.create({
      data: {
        entityType: ApprovalEntityType.PURCHASE_REQUEST,
        entityId: id,
        approverId: user.id,
        status: ApprovalStatus.APPROVED,
        comments: parsed.data.comments,
      },
    });

    await createNotification({
      userId: purchaseRequest.requestedById,
      title: "Purchase request approved",
      message: `Purchase request ${purchaseRequest.requestNumber} has been approved`,
      type: "SUCCESS",
      link: `/purchase-requests/${id}`,
    });

    await logAudit({
      userId: user.id,
      action: "APPROVE",
      tableName: "purchase_requests",
      recordId: id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "APPROVE_PURCHASE_REQUEST",
      module: "purchase_requests",
      entityType: "PurchaseRequest",
      entityId: id,
      ipAddress: ip,
    });

    return success(updated, { message: "Purchase request approved" });
  },
);

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
import { rejectPurchaseRequestSchema } from "@/lib/validations/purchase-requests";
import { logActivity, logAudit } from "@/lib/services/audit.service";
import { createNotification } from "@/lib/services/notification.service";

export const POST = withPermission(
  PERMISSIONS.PURCHASE_APPROVE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, rejectPurchaseRequestSchema);
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
      data: {
        status: PurchaseRequestStatus.REJECTED,
        remarks: parsed.data.comments,
      },
    });

    await prisma.approval.create({
      data: {
        entityType: ApprovalEntityType.PURCHASE_REQUEST,
        entityId: id,
        approverId: user.id,
        status: ApprovalStatus.REJECTED,
        comments: parsed.data.comments,
      },
    });

    await createNotification({
      userId: purchaseRequest.requestedById,
      title: "Purchase request rejected",
      message: `Purchase request ${purchaseRequest.requestNumber} has been rejected`,
      type: "WARNING",
      link: `/purchase-requests/${id}`,
    });

    await logAudit({
      userId: user.id,
      action: "REJECT",
      tableName: "purchase_requests",
      recordId: id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "REJECT_PURCHASE_REQUEST",
      module: "purchase_requests",
      entityType: "PurchaseRequest",
      entityId: id,
      ipAddress: ip,
    });

    return success(updated, { message: "Purchase request rejected" });
  },
);

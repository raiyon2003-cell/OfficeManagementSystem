import type { NextRequest } from "next/server";
import {
  VisitorStatus,
  VisitorLogAction,
  ApprovalEntityType,
  ApprovalStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { getClientIp, parseJsonBody, resolveParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { hasPermission } from "@/lib/auth/permissions";
import { withAuth } from "@/lib/middleware/auth-middleware";
import { approveVisitorSchema } from "@/lib/validations/visitors";
import { logActivity, logAudit } from "@/lib/services/audit.service";
import { createNotification } from "@/lib/services/notification.service";

export const POST = withAuth(
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, approveVisitorSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      return error("Visitor not found", { code: "NOT_FOUND", status: 404 });
    }

    const canApprove =
      hasPermission(user.role, PERMISSIONS.VISITORS_APPROVE) ||
      visitor.hostId === user.id;

    if (!canApprove) {
      return error("Insufficient permissions", { code: "FORBIDDEN", status: 403 });
    }

    if (visitor.status !== VisitorStatus.PENDING) {
      return error("Visitor is not pending approval", {
        code: "INVALID_STATUS",
        status: 400,
      });
    }

    const { approved, rejectionReason } = parsed.data;
    const newStatus = approved ? VisitorStatus.APPROVED : VisitorStatus.REJECTED;

    const updated = await prisma.visitor.update({
      where: { id },
      data: {
        status: newStatus,
        approvedById: user.id,
        approvedAt: new Date(),
        rejectionReason: approved ? null : rejectionReason,
      },
    });

    await prisma.approval.create({
      data: {
        entityType: ApprovalEntityType.VISITOR,
        entityId: id,
        approverId: user.id,
        status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        comments: rejectionReason,
      },
    });

    await prisma.visitorLog.create({
      data: {
        visitorId: id,
        action: approved ? VisitorLogAction.APPROVED : VisitorLogAction.REJECTED,
        performedById: user.id,
      },
    });

    await createNotification({
      userId: visitor.hostId,
      title: approved ? "Visitor approved" : "Visitor rejected",
      message: `${visitor.fullName} has been ${approved ? "approved" : "rejected"}`,
      type: approved ? "SUCCESS" : "WARNING",
      link: `/visitors/${id}`,
    });

    await logAudit({
      userId: user.id,
      action: approved ? "APPROVE" : "REJECT",
      tableName: "visitors",
      recordId: id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: approved ? "APPROVE_VISITOR" : "REJECT_VISITOR",
      module: "visitors",
      entityType: "Visitor",
      entityId: id,
      ipAddress: ip,
    });

    return success(updated, {
      message: approved ? "Visitor approved" : "Visitor rejected",
    });
  },
);

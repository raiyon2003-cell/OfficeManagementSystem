import type { NextRequest } from "next/server";
import {
  VisitorStatus,
  VisitorPassStatus,
  VisitorLogAction,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import {
  generatePassNumber,
  getClientIp,
  parseJsonBody,
  resolveParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { checkInVisitorSchema } from "@/lib/validations/visitors";
import { logActivity, logAudit } from "@/lib/services/audit.service";
import { createNotification } from "@/lib/services/notification.service";

export const POST = withPermission(
  PERMISSIONS.VISITORS_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, checkInVisitorSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: { host: true },
    });

    if (!visitor) {
      return error("Visitor not found", { code: "NOT_FOUND", status: 404 });
    }

    if (
      visitor.status !== VisitorStatus.APPROVED &&
      visitor.status !== VisitorStatus.PENDING
    ) {
      return error("Visitor cannot be checked in", {
        code: "INVALID_STATUS",
        status: 400,
      });
    }

    const passNumber = generatePassNumber();

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.visitor.update({
        where: { id },
        data: {
          status: VisitorStatus.CHECKED_IN,
          checkInAt: new Date(),
          badgeNumber: parsed.data.badgeNumber ?? visitor.badgeNumber,
        },
      });

      const pass = await tx.visitorPass.create({
        data: {
          visitorId: id,
          passNumber,
          status: VisitorPassStatus.ACTIVE,
        },
      });

      await tx.visitorLog.create({
        data: {
          visitorId: id,
          action: VisitorLogAction.CHECKED_IN,
          performedById: user.id,
        },
      });

      await tx.visitorLog.create({
        data: {
          visitorId: id,
          action: VisitorLogAction.PASS_ISSUED,
          performedById: user.id,
          metadata: { passNumber },
        },
      });

      return { updated, pass };
    });

    await createNotification({
      userId: visitor.hostId,
      title: "Visitor checked in",
      message: `${visitor.fullName} has checked in`,
      type: "INFO",
      link: `/visitors/${id}`,
    });

    await logAudit({
      userId: user.id,
      action: "CHECK_IN",
      tableName: "visitors",
      recordId: id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "VISITOR_CHECK_IN",
      module: "visitors",
      entityType: "Visitor",
      entityId: id,
      ipAddress: ip,
    });

    return success(
      { visitor: result.updated, pass: result.pass },
      { message: "Visitor checked in" },
    );
  },
);

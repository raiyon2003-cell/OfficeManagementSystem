import {
  VisitorStatus,
  VisitorPassStatus,
  VisitorLogAction,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { getClientIp, resolveParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const POST = withPermission(
  PERMISSIONS.VISITORS_WRITE,
  async (request, { user, params }) => {
    const { id } = await resolveParams(params);
    const ip = getClientIp(request);

    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      return error("Visitor not found", { code: "NOT_FOUND", status: 404 });
    }

    if (visitor.status !== VisitorStatus.CHECKED_IN) {
      return error("Visitor is not checked in", {
        code: "INVALID_STATUS",
        status: 400,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.visitor.update({
        where: { id },
        data: {
          status: VisitorStatus.CHECKED_OUT,
          checkOutAt: new Date(),
        },
      });

      await tx.visitorPass.updateMany({
        where: { visitorId: id, status: VisitorPassStatus.ACTIVE },
        data: { status: VisitorPassStatus.RETURNED, returnedAt: new Date() },
      });

      await tx.visitorLog.create({
        data: {
          visitorId: id,
          action: VisitorLogAction.CHECKED_OUT,
          performedById: user.id,
        },
      });

      await tx.visitorLog.create({
        data: {
          visitorId: id,
          action: VisitorLogAction.PASS_RETURNED,
          performedById: user.id,
        },
      });

      return v;
    });

    await logAudit({
      userId: user.id,
      action: "CHECK_OUT",
      tableName: "visitors",
      recordId: id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "VISITOR_CHECK_OUT",
      module: "visitors",
      entityType: "Visitor",
      entityId: id,
      ipAddress: ip,
    });

    return success(updated, { message: "Visitor checked out" });
  },
);

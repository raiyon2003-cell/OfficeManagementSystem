import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  resolveParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { updateVisitorSchema } from "@/lib/validations/visitors";
import { VisitorLogAction } from "@/generated/prisma/client";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(
  PERMISSIONS.VISITORS_READ,
  async (_request, { params }) => {
    const { id } = await resolveParams(params);

    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        logs: {
          orderBy: { createdAt: "desc" },
          include: {
            performedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        passes: { orderBy: { issuedAt: "desc" } },
      },
    });

    if (!visitor) {
      return error("Visitor not found", { code: "NOT_FOUND", status: 404 });
    }

    return success(visitor);
  },
);

export const PATCH = withPermission(
  PERMISSIONS.VISITORS_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, updateVisitorSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const existing = await prisma.visitor.findUnique({ where: { id } });
    if (!existing) {
      return error("Visitor not found", { code: "NOT_FOUND", status: 404 });
    }

    const visitor = await prisma.visitor.update({
      where: { id },
      data: parsed.data,
      include: {
        host: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await prisma.visitorLog.create({
      data: {
        visitorId: id,
        action: VisitorLogAction.UPDATED,
        performedById: user.id,
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      tableName: "visitors",
      recordId: id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE_VISITOR",
      module: "visitors",
      entityType: "Visitor",
      entityId: id,
      ipAddress: ip,
    });

    return success(visitor, { message: "Visitor updated" });
  },
);

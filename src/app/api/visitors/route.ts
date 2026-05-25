import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { VisitorStatus, VisitorLogAction } from "@/generated/prisma/client";
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
  createVisitorSchema,
  listVisitorsSchema,
} from "@/lib/validations/visitors";
import { logActivity, logAudit } from "@/lib/services/audit.service";
import { createNotification } from "@/lib/services/notification.service";

export const GET = withPermission(PERMISSIONS.VISITORS_READ, async (request) => {
  const parsed = parseSearchParams(request, listVisitorsSchema);
  if (!parsed.success) return parsed.response;

  const { page, limit, search, sortBy, sortOrder, status, hostId, scheduledDate, dateFrom, dateTo } =
    parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.VisitorWhereInput = {
    ...(status ? { status } : {}),
    ...(hostId ? { hostId } : {}),
    ...(scheduledDate ? { scheduledDate } : {}),
    ...(dateFrom || dateTo
      ? {
          scheduledDate: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.VisitorOrderByWithRelationInput = sortBy
    ? { [sortBy]: sortOrder }
    : { createdAt: sortOrder };

  const [visitors, total] = await Promise.all([
    prisma.visitor.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        host: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.visitor.count({ where }),
  ]);

  return paginated(visitors, { page, limit, total });
});

export const POST = withPermission(
  PERMISSIONS.VISITORS_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createVisitorSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const { isWalkIn, ...data } = parsed.data;

    const host = await prisma.user.findFirst({
      where: { id: data.hostId, isActive: true, deletedAt: null },
    });
    if (!host) {
      return error("Host not found", { code: "HOST_NOT_FOUND", status: 400 });
    }

    const status = isWalkIn ? VisitorStatus.CHECKED_IN : VisitorStatus.PENDING;

    const visitor = await prisma.visitor.create({
      data: {
        ...data,
        status,
        checkInAt: isWalkIn ? new Date() : undefined,
      },
      include: {
        host: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await prisma.visitorLog.create({
      data: {
        visitorId: visitor.id,
        action: VisitorLogAction.CREATED,
        performedById: user.id,
      },
    });

    await createNotification({
      userId: data.hostId,
      title: "New visitor registration",
      message: `${visitor.fullName} has been registered as a visitor`,
      type: "INFO",
      link: `/visitors/${visitor.id}`,
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "visitors",
      recordId: visitor.id,
      newValues: { fullName: visitor.fullName, status },
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CREATE_VISITOR",
      module: "visitors",
      entityType: "Visitor",
      entityId: visitor.id,
      ipAddress: ip,
    });

    return success(visitor, { message: "Visitor created", status: 201 });
  },
);

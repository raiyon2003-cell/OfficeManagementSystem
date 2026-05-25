import { ReportType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { parseSearchParams, resolveParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { reportTypeQuerySchema } from "@/lib/validations/reports";

async function getReportData(
  type: ReportType,
  params: {
    startDate?: Date;
    endDate?: Date;
    roomId?: string;
    categoryId?: string;
    status?: string;
  },
) {
  const dateFilter =
    params.startDate || params.endDate
      ? {
          ...(params.startDate ? { gte: params.startDate } : {}),
          ...(params.endDate ? { lte: params.endDate } : {}),
        }
      : undefined;

  switch (type) {
    case ReportType.VISITOR:
      return prisma.visitor.findMany({
        where: {
          ...(dateFilter ? { scheduledDate: dateFilter } : {}),
        },
        include: {
          host: { select: { firstName: true, lastName: true } },
        },
        orderBy: { scheduledDate: "desc" },
      });
    case ReportType.BOOKING:
      return prisma.roomBooking.findMany({
        where: {
          deletedAt: null,
          ...(params.roomId ? { roomId: params.roomId } : {}),
          ...(dateFilter ? { date: dateFilter } : {}),
        },
        include: {
          room: { select: { name: true } },
          organizer: { select: { firstName: true, lastName: true } },
        },
        orderBy: { date: "desc" },
      });
    case ReportType.INVENTORY:
      return prisma.inventoryItem.findMany({
        where: {
          deletedAt: null,
          ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        },
        include: { category: true },
        orderBy: { name: "asc" },
      });
    case ReportType.STATIONERY:
      return prisma.stationeryItem.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
    case ReportType.PURCHASE:
      return prisma.purchaseRequest.findMany({
        where: { deletedAt: null },
        include: { items: true, vendor: true },
        orderBy: { createdAt: "desc" },
      });
    case ReportType.EXPENSE:
      return prisma.officeExpense.findMany({
        where: {
          ...(dateFilter ? { expenseDate: dateFilter } : {}),
        },
        include: {
          vendor: true,
          recordedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { expenseDate: "desc" },
      });
    case ReportType.VENDOR:
      return prisma.vendor.findMany({
        where: { deletedAt: null },
        include: { category: true },
        orderBy: { name: "asc" },
      });
    case ReportType.AUDIT:
      return prisma.auditLog.findMany({
        where: {
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      });
    default:
      return [];
  }
}

export const GET = withPermission(
  PERMISSIONS.REPORTS_READ,
  async (request, { params }) => {
    const { type } = await resolveParams(params);
    const typeUpper = type.toUpperCase() as ReportType;

    if (!Object.values(ReportType).includes(typeUpper)) {
      return error("Invalid report type", { code: "INVALID_TYPE", status: 400 });
    }

    const parsed = parseSearchParams(request, reportTypeQuerySchema);
    if (!parsed.success) return parsed.response;

    const data = await getReportData(typeUpper, parsed.data);

    return success({
      type: typeUpper,
      parameters: parsed.data,
      count: Array.isArray(data) ? data.length : 0,
      data,
    });
  },
);

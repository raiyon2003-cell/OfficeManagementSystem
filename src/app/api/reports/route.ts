import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { ReportStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { paginated, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import {
  generateReportSchema,
  listReportsSchema,
} from "@/lib/validations/reports";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(PERMISSIONS.REPORTS_READ, async (request) => {
  const parsed = parseSearchParams(request, listReportsSchema);
  if (!parsed.success) return parsed.response;

  const { page, limit, sortOrder, type, status } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.ReportWhereInput = {
    ...(type ? { type } : {}),
    ...(status ? { status: status as ReportStatus } : {}),
  };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
      include: {
        generatedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return paginated(reports, { page, limit, total });
});

export const POST = withPermission(
  PERMISSIONS.REPORTS_READ,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, generateReportSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);

    const report = await prisma.report.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        parameters: (parsed.data.parameters ?? {}) as Prisma.InputJsonValue,
        generatedById: user.id,
        status: ReportStatus.COMPLETED,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "reports",
      recordId: report.id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "GENERATE_REPORT",
      module: "reports",
      entityType: "Report",
      entityId: report.id,
      ipAddress: ip,
    });

    return success(report, { message: "Report generated", status: 201 });
  },
);

import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { ReportStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api-response";
import { getClientIp, parseJsonBody } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { generateReportSchema } from "@/lib/validations/reports";
import { logActivity } from "@/lib/services/audit.service";

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
        status: ReportStatus.GENERATING,
      },
    });

    await logActivity({
      userId: user.id,
      action: "GENERATE_REPORT",
      module: "reports",
      entityType: "Report",
      entityId: report.id,
      ipAddress: ip,
    });

    return success(report, { message: "Report generation started", status: 202 });
  },
);

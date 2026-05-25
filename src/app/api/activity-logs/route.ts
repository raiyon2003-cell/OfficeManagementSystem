import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { paginated } from "@/lib/api-response";
import { parseSearchParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { listActivityLogsSchema } from "@/lib/validations/activity-logs";

export const GET = withPermission(PERMISSIONS.ACTIVITY_READ, async (request) => {
  const parsed = parseSearchParams(request, listActivityLogsSchema);
  if (!parsed.success) return parsed.response;

  const { page, limit, userId, module, action, dateFrom, dateTo } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.ActivityLogWhereInput = {
    ...(userId ? { userId } : {}),
    ...(module ? { module } : {}),
    ...(action ? { action } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return paginated(logs, { page, limit, total });
});

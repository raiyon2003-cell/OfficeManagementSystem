import { prisma } from "@/lib/prisma";
import { paginated } from "@/lib/api-response";
import { parseSearchParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { paginationSchema } from "@/lib/validations/common";

export const GET = withPermission(PERMISSIONS.DASHBOARD_READ, async (request) => {
  const parsed = parseSearchParams(request, paginationSchema);
  if (!parsed.success) return parsed.response;

  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.activityLog.count(),
  ]);

  return paginated(activities, { page, limit, total });
});

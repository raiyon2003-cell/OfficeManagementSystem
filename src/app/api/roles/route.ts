import { prisma } from "@/lib/prisma";
import { paginated } from "@/lib/api-response";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";

export const GET = withPermission(PERMISSIONS.USERS_READ, async () => {
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: { select: { users: true } },
    },
  });

  return paginated(roles, {
    page: 1,
    limit: roles.length,
    total: roles.length,
  });
});

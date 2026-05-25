import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api-response";
import { resolvePrimaryRole } from "@/lib/auth/roles";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { roleNameToAppRole } from "@/lib/auth/role-mapping";
import { withAuth } from "@/lib/middleware/auth-middleware";

export const GET = withAuth(async (_request, { user }) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      department: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!dbUser) {
    return success(null);
  }

  const roleNames = dbUser.roles.map((r) => r.role.name);
  const primaryRole = resolvePrimaryRole(roleNames);
  const dbPermissions = [
    ...new Set(
      dbUser.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission),
      ),
    ),
  ];

  return success({
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    phone: dbUser.phone,
    department: dbUser.department,
    isActive: dbUser.isActive,
    lastLoginAt: dbUser.lastLoginAt,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
    role: primaryRole,
    permissions: getPermissionsForRole(primaryRole),
    roles: dbUser.roles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      appRole: roleNameToAppRole(ur.role.name),
      permissions: ur.role.permissions.map((rp) => rp.permission),
    })),
    dbPermissions,
  });
});

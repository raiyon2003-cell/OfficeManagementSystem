import { RoleName } from "@/generated/prisma/client";
import { ROLES } from "@/lib/constants";
import type { Role } from "@/types";

const ROLE_NAME_TO_APP_ROLE: Record<RoleName, Role> = {
  [RoleName.SUPER_ADMIN]: ROLES.SUPER_ADMIN,
  [RoleName.OFFICE_ADMIN]: ROLES.ADMIN,
  [RoleName.MANAGEMENT]: ROLES.MANAGER,
  [RoleName.EMPLOYEE]: ROLES.EMPLOYEE,
};

const ROLE_PRIORITY: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HR,
  ROLES.FINANCE,
  ROLES.MANAGER,
  ROLES.EMPLOYEE,
];

export function mapRoleNameToAppRole(roleName: RoleName): Role {
  return ROLE_NAME_TO_APP_ROLE[roleName] ?? ROLES.EMPLOYEE;
}

export function resolvePrimaryRole(roleNames: RoleName[]): Role {
  const appRoles = roleNames.map(mapRoleNameToAppRole);

  for (const role of ROLE_PRIORITY) {
    if (appRoles.includes(role)) {
      return role;
    }
  }

  return ROLES.EMPLOYEE;
}

export function resolvePrimaryRoleFromNames(roleNames: string[]): Role {
  const normalized = roleNames
    .map((name) => name.toUpperCase())
    .filter((name): name is RoleName =>
      Object.values(RoleName).includes(name as RoleName),
    );

  return resolvePrimaryRole(normalized);
}

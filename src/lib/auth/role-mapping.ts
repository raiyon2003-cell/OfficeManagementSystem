import { ROLES } from "@/lib/constants";
import { RoleName } from "@/generated/prisma/client";
import type { Role } from "@/types";

export const APP_ROLE_TO_ROLE_NAME: Partial<Record<Role, RoleName>> = {
  [ROLES.SUPER_ADMIN]: RoleName.SUPER_ADMIN,
  [ROLES.ADMIN]: RoleName.OFFICE_ADMIN,
  [ROLES.MANAGER]: RoleName.MANAGEMENT,
  [ROLES.EMPLOYEE]: RoleName.EMPLOYEE,
};

export function appRoleToRoleName(role: Role): RoleName | null {
  return APP_ROLE_TO_ROLE_NAME[role] ?? null;
}

export function roleNameToAppRole(roleName: RoleName): Role {
  const mapping: Record<RoleName, Role> = {
    [RoleName.SUPER_ADMIN]: ROLES.SUPER_ADMIN,
    [RoleName.OFFICE_ADMIN]: ROLES.ADMIN,
    [RoleName.MANAGEMENT]: ROLES.MANAGER,
    [RoleName.EMPLOYEE]: ROLES.EMPLOYEE,
  };
  return mapping[roleName] ?? ROLES.EMPLOYEE;
}

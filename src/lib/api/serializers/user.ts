import type { RoleName } from "@/generated/prisma/client";
import { resolvePrimaryRole } from "@/lib/auth/roles";
import type { Role } from "@/types";

type UserWithRoles = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  department?: string | null;
  isActive: boolean;
  lastLoginAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  roles: Array<{ role: { id: string; name: RoleName } }>;
};

export function serializeUser<T extends UserWithRoles>(user: T) {
  const roleNames = user.roles.map((entry) => entry.role.name);
  const role: Role = resolvePrimaryRole(roleNames);

  return {
    ...user,
    role,
    roleNames,
    roles: user.roles.map((entry) => ({
      id: entry.role.id,
      name: entry.role.name,
    })),
  };
}

export function serializeUsers<T extends UserWithRoles>(users: T[]) {
  return users.map(serializeUser);
}

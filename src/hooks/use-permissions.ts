"use client";

import { useCallback, useMemo } from "react";
import {
  getPermissionsForRole,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "@/lib/auth/permissions";
import type { Permission } from "@/lib/constants";
import type { Role } from "@/types";
import { useAuthStore } from "@/store/auth-store";

export function usePermissions(roleOverride?: Role) {
  const user = useAuthStore((state) => state.user);
  const role = roleOverride ?? user?.role;

  const permissions = useMemo(
    () => (role ? getPermissionsForRole(role) : []),
    [role],
  );

  const can = useCallback(
    (permission: Permission) => {
      if (!role) {
        return false;
      }

      return hasPermission(role, permission);
    },
    [role],
  );

  const canAny = useCallback(
    (requiredPermissions: Permission[]) => {
      if (!role) {
        return false;
      }

      return hasAnyPermission(role, requiredPermissions);
    },
    [role],
  );

  const canAll = useCallback(
    (requiredPermissions: Permission[]) => {
      if (!role) {
        return false;
      }

      return hasAllPermissions(role, requiredPermissions);
    },
    [role],
  );

  return {
    role,
    permissions,
    can,
    canAny,
    canAll,
  };
}

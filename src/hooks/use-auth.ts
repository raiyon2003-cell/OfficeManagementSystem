"use client";

import { useCallback, useEffect } from "react";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import type { AuthTokens, AuthUser } from "@/types";
import { useAuthStore } from "@/store/auth-store";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const updateUser = useAuthStore((state) => state.updateUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);

  const login = useCallback(
    (nextUser: AuthUser, tokens: AuthTokens) => {
      setAuth(
        {
          ...nextUser,
          permissions: getPermissionsForRole(nextUser.role),
        },
        tokens,
      );
    },
    [setAuth],
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isHydrated,
    isLoading: !isHydrated,
    login,
    logout,
    updateUser,
    setTokens,
    clearAuth,
  };
}

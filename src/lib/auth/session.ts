import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/lib/constants";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { resolvePrimaryRole } from "@/lib/auth/roles";
import { RoleName } from "@/generated/prisma/client";
import type { AuthUser, Role, Session } from "@/types";

function extractBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

export function getAccessTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const bearerToken = extractBearerToken(request);

  return cookieToken ?? bearerToken;
}

export function getRefreshTokenFromRequest(
  request: NextRequest,
): string | null {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)?.value;
  const headerToken = request.headers.get("x-refresh-token");

  return cookieToken ?? headerToken;
}

export function getUserFromToken(token: string): AuthUser | null {
  try {
    const payload = verifyAccessToken(token);
    const role = payload.role as Role;

    return {
      id: payload.sub,
      email: payload.email,
      firstName: "",
      lastName: "",
      role,
      permissions: getPermissionsForRole(role),
    };
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest): Session | null {
  const accessToken = getAccessTokenFromRequest(request);

  if (!accessToken) {
    return null;
  }

  try {
    const payload = verifyAccessToken(accessToken);
    const role = payload.role as Role;
    const refreshToken = getRefreshTokenFromRequest(request) ?? undefined;

    return {
      accessToken,
      refreshToken,
      user: {
        id: payload.sub,
        email: payload.email,
        firstName: "",
        lastName: "",
        role,
        permissions: getPermissionsForRole(role),
      },
    };
  } catch {
    return null;
  }
}

export async function getSessionFromRequestWithUser(
  request: NextRequest,
): Promise<Session | null> {
  const session = getSessionFromRequest(request);

  if (!session) {
    return null;
  }

  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      roles: {
        select: {
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const roleNames = user.roles.map((entry) => entry.role.name as RoleName);
  const role = resolvePrimaryRole(roleNames);

  return {
    ...session,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role,
      permissions: getPermissionsForRole(role),
    },
  };
}

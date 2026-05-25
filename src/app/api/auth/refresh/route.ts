import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error } from "@/lib/api-response";
import { createAuthResponse } from "@/lib/api/auth-cookies";
import { getClientIp } from "@/lib/api/helpers";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth/jwt";
import { resolvePrimaryRole } from "@/lib/auth/roles";
import { getRefreshTokenFromRequest } from "@/lib/auth/session";
import { logActivity } from "@/lib/services/audit.service";

export async function POST(request: NextRequest) {
  const refreshToken = getRefreshTokenFromRequest(request);
  const ip = getClientIp(request);

  if (!refreshToken) {
    return error("Refresh token required", {
      code: "REFRESH_TOKEN_REQUIRED",
      status: 401,
    });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            roles: { include: { role: true } },
          },
        },
      },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt < new Date() ||
      !storedToken.user.isActive ||
      storedToken.user.deletedAt
    ) {
      return error("Invalid refresh token", {
        code: "INVALID_REFRESH_TOKEN",
        status: 401,
      });
    }

    if (storedToken.userId !== payload.sub) {
      return error("Invalid refresh token", {
        code: "INVALID_REFRESH_TOKEN",
        status: 401,
      });
    }

    const newAccessToken = signAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: resolvePrimaryRole(storedToken.user.roles.map((r) => r.role.name)),
    });
    const newRefreshToken = signRefreshToken(storedToken.user.id);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          userId: storedToken.userId,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    await logActivity({
      userId: storedToken.userId,
      action: "TOKEN_REFRESH",
      module: "auth",
      ipAddress: ip,
    });

    return createAuthResponse(
      { refreshed: true },
      { accessToken: newAccessToken, refreshToken: newRefreshToken },
      { message: "Token refreshed" },
    );
  } catch {
    return error("Invalid refresh token", {
      code: "INVALID_REFRESH_TOKEN",
      status: 401,
    });
  }
}

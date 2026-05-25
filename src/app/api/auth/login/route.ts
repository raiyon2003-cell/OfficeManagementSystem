import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error } from "@/lib/api-response";
import { createAuthResponse } from "@/lib/api/auth-cookies";
import { getClientIp, parseJsonBody } from "@/lib/api/helpers";
import { comparePassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth/jwt";
import { resolvePrimaryRole } from "@/lib/auth/roles";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { roleNameToAppRole } from "@/lib/auth/role-mapping";
import { getRefreshTokenFromRequest } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations/auth";
import { logActivity } from "@/lib/services/audit.service";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, loginSchema);
  if (!parsed.success) return parsed.response;

  const { email, password } = parsed.data;
  const ip = getClientIp(request);

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
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

    if (!user || user.deletedAt || !user.isActive) {
      return error("Invalid email or password", {
        code: "INVALID_CREDENTIALS",
        status: 401,
      });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return error("Invalid email or password", {
        code: "INVALID_CREDENTIALS",
        status: 401,
      });
    }

    const roleNames = user.roles.map((r) => r.role.name);
    const primaryRole = resolvePrimaryRole(roleNames);
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: primaryRole,
    });
    const refreshToken = signRefreshToken(user.id);

    await prisma.$transaction([
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    await logActivity({
      userId: user.id,
      action: "LOGIN",
      module: "auth",
      ipAddress: ip,
    });

    const permissions = [
      ...new Set(
        user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.name),
        ),
      ),
    ];

    return createAuthResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: primaryRole,
          permissions: getPermissionsForRole(primaryRole),
          dbPermissions: permissions,
          roles: user.roles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.name,
            appRole: roleNameToAppRole(ur.role.name),
          })),
        },
        tokens: { accessToken, refreshToken },
      },
      { accessToken, refreshToken },
      { message: "Login successful" },
    );
  } catch (err) {
    console.error("Login error:", err);
    return error("Login failed", { code: "LOGIN_FAILED", status: 500 });
  }
}

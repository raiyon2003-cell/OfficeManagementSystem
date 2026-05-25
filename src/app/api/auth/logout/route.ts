import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearAuthCookies } from "@/lib/api/auth-cookies";
import { getClientIp } from "@/lib/api/helpers";
import { getRefreshTokenFromRequest } from "@/lib/auth/session";
import { withAuth } from "@/lib/middleware/auth-middleware";
import { logActivity } from "@/lib/services/audit.service";

export const POST = withAuth(async (request: NextRequest, { user }) => {
  const refreshToken = getRefreshTokenFromRequest(request);
  const ip = getClientIp(request);

  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await logActivity({
    userId: user.id,
    action: "LOGOUT",
    module: "auth",
    ipAddress: ip,
  });

  const body = { success: true as const, data: { loggedOut: true }, message: "Logged out successfully" };
  const response = NextResponse.json(body, { status: 200 });
  return clearAuthCookies(response);
});

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { getClientIp, parseJsonBody } from "@/lib/api/helpers";
import { hashPassword } from "@/lib/auth/password";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, resetPasswordSchema);
  if (!parsed.success) return parsed.response;

  const { token, password } = parsed.data;
  const ip = getClientIp(request);

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt < new Date() ||
      !resetToken.user.isActive ||
      resetToken.user.deletedAt
    ) {
      return error("Invalid or expired reset token", {
        code: "INVALID_TOKEN",
        status: 400,
      });
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await logAudit({
      userId: resetToken.userId,
      action: "UPDATE",
      tableName: "users",
      recordId: resetToken.userId,
      ipAddress: ip,
    });

    await logActivity({
      userId: resetToken.userId,
      action: "PASSWORD_RESET",
      module: "auth",
      ipAddress: ip,
    });

    return success({ reset: true }, { message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    return error("Failed to reset password", { status: 500 });
  }
}

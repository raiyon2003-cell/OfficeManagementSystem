import type { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { getClientIp, parseJsonBody } from "@/lib/api/helpers";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/lib/services/email.service";
import { logActivity } from "@/lib/services/audit.service";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, forgotPasswordSchema);
  if (!parsed.success) return parsed.response;

  const { email } = parsed.data;
  const ip = getClientIp(request);

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

  if (user && user.isActive && !user.deletedAt) {
      const token = randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await sendPasswordResetEmail(
        user.email,
        resetUrl,
        `${user.firstName} ${user.lastName}`,
      );

      await logActivity({
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        module: "auth",
        ipAddress: ip,
      });
    }

    return success(
      { sent: true },
      {
        message:
          "If an account exists with that email, a reset link has been sent",
      },
    );
  } catch (err) {
    console.error("Forgot password error:", err);
    return error("Failed to process request", { status: 500 });
  }
}

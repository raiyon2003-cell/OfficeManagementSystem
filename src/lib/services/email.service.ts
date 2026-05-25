import { Resend } from "resend";

let resendClient: Resend | undefined;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  id: string | null;
  success: boolean;
  error?: string;
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const from =
    input.from ??
    process.env.RESEND_FROM_EMAIL ??
    "Office Management <noreply@example.com>";

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });

    if (error) {
      return {
        id: null,
        success: false,
        error: error.message,
      };
    }

    return {
      id: data?.id ?? null,
      success: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";

    return {
      id: null,
      success: false,
      error: message,
    };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  userName?: string,
) {
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  return sendEmail({
    to: email,
    subject: "Reset your password",
    html: `
      <p>${greeting}</p>
      <p>We received a request to reset your password. Click the link below to choose a new password:</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
    text: `${greeting}\n\nReset your password: ${resetUrl}`,
  });
}

export async function sendWelcomeEmail(
  email: string,
  userName: string,
  loginUrl: string,
) {
  return sendEmail({
    to: email,
    subject: "Welcome to Office Management",
    html: `
      <p>Hi ${userName},</p>
      <p>Your account has been created. You can sign in using the link below:</p>
      <p><a href="${loginUrl}">Sign in</a></p>
    `,
    text: `Hi ${userName},\n\nSign in: ${loginUrl}`,
  });
}

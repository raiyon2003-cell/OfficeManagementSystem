import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/lib/constants";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
) {
  response.cookies.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60,
  });

  response.cookies.set(AUTH_COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });

  response.cookies.set(AUTH_COOKIE_NAMES.REFRESH_TOKEN, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });

  return response;
}

export function createAuthResponse<T>(
  data: T,
  tokens: { accessToken: string; refreshToken: string },
  options?: { message?: string; status?: number },
) {
  const response = NextResponse.json(
    {
      success: true as const,
      data,
      ...(options?.message ? { message: options.message } : {}),
    },
    { status: options?.status ?? 200 },
  );

  return setAuthCookies(response, tokens);
}

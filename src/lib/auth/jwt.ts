import jwt from "jsonwebtoken";
import {
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY,
  ROLES,
} from "@/lib/constants";
import type { JwtAccessPayload, JwtRefreshPayload, Role } from "@/types";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return secret;
}

function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  }

  return secret;
}

export function signAccessToken(payload: {
  userId: string;
  email: string;
  role: Role;
}): string {
  const tokenPayload: JwtAccessPayload = {
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    type: "access",
  };

  return jwt.sign(tokenPayload, getJwtSecret(), {
    expiresIn: JWT_ACCESS_EXPIRY,
  });
}

export function signRefreshToken(userId: string): string {
  const tokenPayload: JwtRefreshPayload = {
    sub: userId,
    type: "refresh",
  };

  return jwt.sign(tokenPayload, getJwtRefreshSecret(), {
    expiresIn: JWT_REFRESH_EXPIRY,
  });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  const payload = jwt.verify(token, getJwtSecret()) as JwtAccessPayload;

  if (payload.type !== "access") {
    throw new Error("Invalid access token type");
  }

  if (!Object.values(ROLES).includes(payload.role as ROLES)) {
    throw new Error("Invalid role in access token");
  }

  return payload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  const payload = jwt.verify(token, getJwtRefreshSecret()) as JwtRefreshPayload;

  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token type");
  }

  return payload;
}

export function decodeAccessToken(token: string): JwtAccessPayload | null {
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

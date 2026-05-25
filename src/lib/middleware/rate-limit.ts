import type { NextRequest } from "next/server";
import { error } from "@/lib/api-response";
import { RATE_LIMIT_DEFAULTS } from "@/lib/constants";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientKey(request: NextRequest, keyPrefix = "global"): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  return `${keyPrefix}:${ip}:${userAgent}`;
}

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {},
): RateLimitResult {
  const windowMs = options.windowMs ?? RATE_LIMIT_DEFAULTS.windowMs;
  const maxRequests = options.maxRequests ?? RATE_LIMIT_DEFAULTS.maxRequests;
  const now = Date.now();
  const key = getClientKey(request, options.keyPrefix);

  cleanupExpiredEntries(now);

  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetAt,
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

export function withRateLimit(
  handler: (request: NextRequest) => Promise<Response> | Response,
  options?: RateLimitOptions,
) {
  return async (request: NextRequest) => {
    const result = checkRateLimit(request, options);

    if (!result.allowed) {
      return error("Too many requests", {
        code: "RATE_LIMIT_EXCEEDED",
        status: 429,
      });
    }

    const response = await handler(request);

    response.headers.set("X-RateLimit-Limit", String(result.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.resetAt));

    return response;
  };
}

export function resetRateLimitStore() {
  rateLimitStore.clear();
}

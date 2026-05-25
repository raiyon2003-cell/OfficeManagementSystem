import type { NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { error } from "@/lib/api-response";

export function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

export function validationError(zodError: ZodError) {
  return error("Validation failed", {
    code: "VALIDATION_ERROR",
    status: 400,
    details: zodError.flatten(),
  });
}

export async function parseJsonBody<T>(
  request: NextRequest,
  schema: ZodType<T>,
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return { success: false, response: validationError(result.error) };
    }

    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: error("Invalid JSON body", {
        code: "INVALID_JSON",
        status: 400,
      }),
    };
  }
}

export function parseSearchParams<T>(
  request: NextRequest,
  schema: ZodType<T>,
): { success: true; data: T } | { success: false; response: Response } {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const result = schema.safeParse(params);

  if (!result.success) {
    return { success: false, response: validationError(result.error) };
  }

  return { success: true, data: result.data };
}

export function generatePassNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VP-${timestamp}-${random}`;
}

export function generateRequestNumber(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${date}-${random}`;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

export async function resolveParams(
  params: Promise<Record<string, string | string[]>>,
): Promise<Record<string, string>> {
  const resolved = await params;
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(resolved)) {
    result[key] = Array.isArray(value) ? value[0] : value;
  }

  return result;
}

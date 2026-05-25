import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginatedMeta;
  message?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function success<T>(
  data: T,
  options?: { message?: string; status?: number },
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(options?.message ? { message: options.message } : {}),
    },
    { status: options?.status ?? 200 },
  );
}

export function error(
  message: string,
  options?: { code?: string; status?: number; details?: unknown },
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: options?.code ?? "INTERNAL_ERROR",
        message,
        ...(options?.details !== undefined ? { details: options.details } : {}),
      },
    },
    { status: options?.status ?? 500 },
  );
}

export function paginated<T>(
  data: T[],
  meta: Omit<PaginatedMeta, "hasNextPage" | "hasPreviousPage" | "totalPages">,
  options?: { message?: string; status?: number },
): NextResponse<PaginatedResponse<T>> {
  const totalPages = meta.limit > 0 ? Math.ceil(meta.total / meta.limit) : 0;

  return NextResponse.json(
    {
      success: true as const,
      data,
      meta: {
        ...meta,
        totalPages,
        hasNextPage: meta.page < totalPages,
        hasPreviousPage: meta.page > 1,
      },
      ...(options?.message ? { message: options.message } : {}),
    },
    { status: options?.status ?? 200 },
  );
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): Omit<PaginatedMeta, "hasNextPage" | "hasPreviousPage"> {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}

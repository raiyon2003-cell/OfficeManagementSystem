import type { PaginatedResponse } from "@/lib/api-response";
import type { ListParams } from "@/types/entities";

export function buildQueryParams(params?: ListParams): Record<string, string> {
  if (!params) return {};

  const query: Record<string, string> = {};

  if (params.page != null) query.page = String(params.page);
  if (params.limit != null) query.limit = String(params.limit);
  if (params.search) query.search = params.search;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortOrder) query.sortOrder = params.sortOrder;
  if (params.status) query.status = params.status;
  if (params.categoryId) query.categoryId = params.categoryId;
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;
  if (params.roomId) query.roomId = params.roomId;
  if (params.date) query.date = params.date;

  return query;
}

export interface PaginatedData<T> {
  data: T[];
  meta: PaginatedResponse<T>["meta"];
}

export function unwrapPaginated<T>(
  response: { data: PaginatedResponse<T> },
): PaginatedData<T> {
  if (!response.data.success) {
    throw new Error("Invalid paginated response");
  }
  return {
    data: response.data.data,
    meta: response.data.meta,
  };
}

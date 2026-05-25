import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type { ListParams, ReportDefinition } from "@/types/entities";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

export type ReportFilters = {
  type: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  format?: "pdf" | "excel";
};

export async function getReports(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<ReportDefinition>>(
    "/reports",
    { params: buildQueryParams(params) },
  );
  return unwrapPaginated(response);
}

export async function generateReport(filters: ReportFilters) {
  const response = await apiClient.post<ApiSuccessResponse<ReportDefinition>>(
    "/reports/generate",
    filters,
  );
  return unwrapData(response);
}

export async function exportReport(
  filters: ReportFilters,
  format: "pdf" | "excel",
) {
  const response = await apiClient.post<Blob>(
    "/reports/export",
    { ...filters, format },
    { responseType: "blob" },
  );
  return response.data;
}

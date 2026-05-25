import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type { ListParams, StationeryIssuance, StationeryItem } from "@/types/entities";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

export async function getStationeryItems(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<StationeryItem>>(
    "/stationery",
    { params: buildQueryParams(params) },
  );
  return unwrapPaginated(response);
}

export async function issueStationery(input: {
  itemId: string;
  employeeId: string;
  quantity: number;
  purpose?: string;
}) {
  const response = await apiClient.post<ApiSuccessResponse<StationeryIssuance>>(
    "/stationery/issue",
    input,
  );
  return unwrapData(response);
}

export async function getIssuances(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<StationeryIssuance>>(
    "/stationery/issuances",
    { params: buildQueryParams(params) },
  );
  return unwrapPaginated(response);
}

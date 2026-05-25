import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type { ListParams, PurchaseRequest } from "@/types/entities";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

export type PurchaseRequestInput = {
  title: string;
  description?: string;
  vendorId?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export async function getPurchaseRequests(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<PurchaseRequest>>(
    "/purchase-requests",
    { params: buildQueryParams(params) },
  );
  return unwrapPaginated(response);
}

export async function getPurchaseRequest(id: string) {
  const response = await apiClient.get<ApiSuccessResponse<PurchaseRequest>>(
    `/purchase-requests/${id}`,
  );
  return unwrapData(response);
}

export async function createPurchaseRequest(input: PurchaseRequestInput) {
  const response = await apiClient.post<ApiSuccessResponse<PurchaseRequest>>(
    "/purchase-requests",
    input,
  );
  return unwrapData(response);
}

export async function approvePurchaseRequest(id: string, comment?: string) {
  const response = await apiClient.post<ApiSuccessResponse<PurchaseRequest>>(
    `/purchase-requests/${id}/approve`,
    { comment },
  );
  return unwrapData(response);
}

export async function rejectPurchaseRequest(id: string, reason: string) {
  const response = await apiClient.post<ApiSuccessResponse<PurchaseRequest>>(
    `/purchase-requests/${id}/reject`,
    { reason },
  );
  return unwrapData(response);
}

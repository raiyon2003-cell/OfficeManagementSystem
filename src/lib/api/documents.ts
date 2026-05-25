import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type { DocumentInventory, ListParams, ReprintRequest } from "@/types/entities";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

export async function getDocuments(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<DocumentInventory>>(
    "/documents",
    { params: buildQueryParams(params) },
  );
  return unwrapPaginated(response);
}

export async function createDocument(input: {
  name: string;
  type: string;
  currentStock: number;
  minStockLevel: number;
  location?: string;
}) {
  const response = await apiClient.post<ApiSuccessResponse<DocumentInventory>>(
    "/documents",
    input,
  );
  return unwrapData(response);
}

export async function updateDocument(
  id: string,
  input: Partial<DocumentInventory>,
) {
  const response = await apiClient.patch<ApiSuccessResponse<DocumentInventory>>(
    `/documents/${id}`,
    input,
  );
  return unwrapData(response);
}

export async function getReprintRequests(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<ReprintRequest>>(
    "/documents/reprint-requests",
    { params: buildQueryParams(params) },
  );
  return unwrapPaginated(response);
}

export async function createReprintRequest(input: {
  documentId: string;
  quantity: number;
  purpose: string;
}) {
  const response = await apiClient.post<ApiSuccessResponse<ReprintRequest>>(
    "/documents/reprint-requests",
    input,
  );
  return unwrapData(response);
}

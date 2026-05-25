import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type { ListParams, Vendor } from "@/types/entities";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

export type VendorInput = {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  categoryId?: string;
  notes?: string;
};

export async function getVendors(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<Vendor>>("/vendors", {
    params: buildQueryParams(params),
  });
  return unwrapPaginated(response);
}

export async function getVendor(id: string) {
  const response = await apiClient.get<ApiSuccessResponse<Vendor>>(
    `/vendors/${id}`,
  );
  return unwrapData(response);
}

export async function createVendor(input: VendorInput) {
  const response = await apiClient.post<ApiSuccessResponse<Vendor>>(
    "/vendors",
    input,
  );
  return unwrapData(response);
}

export async function updateVendor(id: string, input: Partial<VendorInput>) {
  const response = await apiClient.patch<ApiSuccessResponse<Vendor>>(
    `/vendors/${id}`,
    input,
  );
  return unwrapData(response);
}

export async function deleteVendor(id: string) {
  await apiClient.delete(`/vendors/${id}`);
}

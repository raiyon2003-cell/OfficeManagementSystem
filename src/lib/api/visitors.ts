import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type { ListParams, Visitor, VisitorLog } from "@/types/entities";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

export type VisitorInput = {
  fullName: string;
  email?: string;
  phone: string;
  company?: string;
  purpose: string;
  idType?: string;
  idNumber?: string;
  vehicleNumber?: string;
  scheduledDate: string;
  scheduledTime?: string;
  hostId?: string;
  notes?: string;
};

export async function getVisitors(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<Visitor>>("/visitors", {
    params: buildQueryParams(params),
  });
  return unwrapPaginated(response);
}

export async function getVisitor(id: string) {
  const response = await apiClient.get<
    ApiSuccessResponse<Visitor & { logs: VisitorLog[] }>
  >(`/visitors/${id}`);
  return unwrapData(response);
}

export async function createVisitor(input: VisitorInput) {
  const response = await apiClient.post<ApiSuccessResponse<Visitor>>(
    "/visitors",
    input,
  );
  return unwrapData(response);
}

export async function updateVisitor(id: string, input: Partial<VisitorInput>) {
  const response = await apiClient.patch<ApiSuccessResponse<Visitor>>(
    `/visitors/${id}`,
    input,
  );
  return unwrapData(response);
}

export async function checkInVisitor(id: string) {
  const response = await apiClient.post<ApiSuccessResponse<Visitor>>(
    `/visitors/${id}/check-in`,
  );
  return unwrapData(response);
}

export async function checkOutVisitor(id: string) {
  const response = await apiClient.post<ApiSuccessResponse<Visitor>>(
    `/visitors/${id}/check-out`,
  );
  return unwrapData(response);
}

export async function approveVisitor(id: string) {
  const response = await apiClient.post<ApiSuccessResponse<Visitor>>(
    `/visitors/${id}/approve`,
  );
  return unwrapData(response);
}

export async function rejectVisitor(id: string, reason: string) {
  const response = await apiClient.post<ApiSuccessResponse<Visitor>>(
    `/visitors/${id}/reject`,
    { reason },
  );
  return unwrapData(response);
}

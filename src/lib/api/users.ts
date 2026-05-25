import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type { ListParams } from "@/types/entities";
import type { User } from "@/types";
import type { CreateUserInput } from "@/lib/validations/auth";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

export async function getUsers(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<User>>("/users", {
    params: buildQueryParams(params),
  });
  return unwrapPaginated(response);
}

export async function getUser(id: string) {
  const response = await apiClient.get<ApiSuccessResponse<User>>(`/users/${id}`);
  return unwrapData(response);
}

export async function createUser(input: CreateUserInput) {
  const response = await apiClient.post<ApiSuccessResponse<User>>("/users", input);
  return unwrapData(response);
}

export async function updateUser(id: string, input: Partial<CreateUserInput>) {
  const response = await apiClient.patch<ApiSuccessResponse<User>>(
    `/users/${id}`,
    input,
  );
  return unwrapData(response);
}

export async function deleteUser(id: string) {
  await apiClient.delete(`/users/${id}`);
}

export async function assignRole(userId: string, roleId: string) {
  const response = await apiClient.post<ApiSuccessResponse<User>>(
    `/users/${userId}/roles`,
    { roleId },
  );
  return unwrapData(response);
}

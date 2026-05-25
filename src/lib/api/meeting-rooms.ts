import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type { ListParams, MeetingRoom } from "@/types/entities";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

export async function getMeetingRooms(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<MeetingRoom>>(
    "/meeting-rooms",
    { params: buildQueryParams(params) },
  );
  return unwrapPaginated(response);
}

export async function getMeetingRoom(id: string) {
  const response = await apiClient.get<ApiSuccessResponse<MeetingRoom>>(
    `/meeting-rooms/${id}`,
  );
  return unwrapData(response);
}

export async function createMeetingRoom(
  input: Omit<MeetingRoom, "id" | "createdAt" | "updatedAt">,
) {
  const response = await apiClient.post<ApiSuccessResponse<MeetingRoom>>(
    "/meeting-rooms",
    input,
  );
  return unwrapData(response);
}

export async function updateMeetingRoom(
  id: string,
  input: Partial<MeetingRoom>,
) {
  const response = await apiClient.patch<ApiSuccessResponse<MeetingRoom>>(
    `/meeting-rooms/${id}`,
    input,
  );
  return unwrapData(response);
}

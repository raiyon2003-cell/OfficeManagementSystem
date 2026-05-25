import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type { NotificationItem } from "@/types";
import type { ListParams } from "@/types/entities";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

export async function getNotifications(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<NotificationItem>>(
    "/notifications",
    { params: buildQueryParams(params) },
  );
  return unwrapPaginated(response);
}

export async function markNotificationRead(id: string) {
  const response = await apiClient.patch<ApiSuccessResponse<NotificationItem>>(
    `/notifications/${id}/read`,
  );
  return unwrapData(response);
}

export async function markAllNotificationsRead() {
  await apiClient.post("/notifications/read-all");
}

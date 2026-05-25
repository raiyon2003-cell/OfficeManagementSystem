import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/lib/api-response";
import type { DashboardOverview } from "@/types/entities";

export async function getDashboardOverview() {
  const response = await apiClient.get<ApiSuccessResponse<DashboardOverview>>(
    "/dashboard",
  );
  return unwrapData(response);
}

export async function getDashboardStats() {
  const response = await apiClient.get<
    ApiSuccessResponse<{
      visitorsToday: number;
      upcomingMeetings: number;
      roomOccupancyPercent: number;
      lowStockCount: number;
      pendingApprovals: number;
    }>
  >("/dashboard/stats");
  return unwrapData(response);
}

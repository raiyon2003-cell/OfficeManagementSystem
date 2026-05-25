import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type { ListParams, OfficeExpense } from "@/types/entities";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

export async function getExpenses(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<OfficeExpense>>(
    "/expenses",
    { params: buildQueryParams(params) },
  );
  return unwrapPaginated(response);
}

export async function getExpenseChart(params?: {
  startDate?: string;
  endDate?: string;
}) {
  const response = await apiClient.get<
    ApiSuccessResponse<{ month: string; amount: number }[]>
  >("/expenses/chart", { params });
  return unwrapData(response);
}

export async function createExpense(input: {
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
  description?: string;
}) {
  const response = await apiClient.post<ApiSuccessResponse<OfficeExpense>>(
    "/expenses",
    input,
  );
  return unwrapData(response);
}

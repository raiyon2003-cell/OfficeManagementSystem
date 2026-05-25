import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type {
  InventoryCategory,
  InventoryItem,
  ListParams,
  StockMovement,
} from "@/types/entities";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

export async function getInventoryItems(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<InventoryItem>>(
    "/inventory/items",
    { params: buildQueryParams(params) },
  );
  return unwrapPaginated(response);
}

export async function getInventoryItem(id: string) {
  const response = await apiClient.get<
    ApiSuccessResponse<InventoryItem & { movements: StockMovement[] }>
  >(`/inventory/items/${id}`);
  return unwrapData(response);
}

export async function getInventoryCategories() {
  const response = await apiClient.get<
    ApiSuccessResponse<InventoryCategory[]>
  >("/inventory/categories");
  return unwrapData(response);
}

export async function createStockMovement(input: {
  itemId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reason?: string;
  reference?: string;
}) {
  const response = await apiClient.post<ApiSuccessResponse<StockMovement>>(
    "/inventory/movements",
    input,
  );
  return unwrapData(response);
}

export async function getStockMovements(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<StockMovement>>(
    "/inventory/movements",
    { params: buildQueryParams(params) },
  );
  return unwrapPaginated(response);
}

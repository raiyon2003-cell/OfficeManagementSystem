import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type { DocumentInventory, ListParams, ReprintRequest } from "@/types/entities";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

type DocumentApiRecord = {
  id: string;
  title: string;
  documentType: string;
  quantity: number;
  minQuantity: number;
  location?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ReprintApiRecord = {
  id: string;
  documentId: string;
  document?: {
    id: string;
    title: string;
    documentType: string;
    quantity?: number;
    minQuantity?: number;
    location?: string | null;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  quantity: number;
  remarks?: string | null;
  status: string;
  requestedById: string;
  createdAt: string;
  updatedAt: string;
};

function toDocumentInventory(record: DocumentApiRecord): DocumentInventory {
  return {
    id: record.id,
    name: record.title,
    type: record.documentType,
    currentStock: record.quantity,
    minStockLevel: record.minQuantity,
    location: record.location ?? null,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function getDocuments(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<DocumentApiRecord>>(
    "/documents",
    { params: buildQueryParams(params) },
  );
  const paginated = unwrapPaginated(response);
  return {
    ...paginated,
    data: paginated.data.map(toDocumentInventory),
  };
}

export async function createDocument(input: {
  name: string;
  type: string;
  currentStock: number;
  minStockLevel: number;
  location?: string;
}) {
  const response = await apiClient.post<ApiSuccessResponse<DocumentApiRecord>>(
    "/documents",
    {
      title: input.name,
      documentType: input.type,
      quantity: input.currentStock,
      minQuantity: input.minStockLevel,
      location: input.location,
    },
  );
  return toDocumentInventory(unwrapData(response));
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
  const response = await apiClient.get<PaginatedResponse<ReprintApiRecord>>(
    "/documents/reprint",
    { params: buildQueryParams(params) },
  );
  const paginated = unwrapPaginated(response);
  return {
    ...paginated,
    data: paginated.data.map((request): ReprintRequest => ({
      id: request.id,
      documentId: request.documentId,
      document: request.document
        ? {
            id: request.document.id,
            name: request.document.title,
            type: request.document.documentType,
            currentStock: request.document.quantity ?? 0,
            minStockLevel: request.document.minQuantity ?? 0,
            location: request.document.location ?? null,
            isActive: request.document.isActive ?? true,
            createdAt: request.document.createdAt ?? request.createdAt,
            updatedAt: request.document.updatedAt ?? request.updatedAt,
          }
        : undefined,
      quantity: request.quantity,
      purpose: request.remarks ?? "",
      status: request.status,
      requestedById: request.requestedById,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    })),
  };
}

export async function createReprintRequest(input: {
  documentId: string;
  quantity: number;
  purpose: string;
}) {
  const response = await apiClient.post<ApiSuccessResponse<ReprintRequest>>(
    "/documents/reprint",
    {
      documentId: input.documentId,
      quantity: input.quantity,
      remarks: input.purpose,
    },
  );
  return unwrapData(response);
}

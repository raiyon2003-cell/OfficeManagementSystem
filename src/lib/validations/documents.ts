import { z } from "zod";
import { DocumentType, ReprintRequestStatus } from "@/generated/prisma/client";
import { paginationSchema } from "@/lib/validations/common";

export const createDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().optional().nullable(),
  quantity: z.coerce.number().int().min(0).default(0),
  minQuantity: z.coerce.number().int().min(0).default(0),
  location: z.string().trim().optional().nullable(),
  shelfNumber: z.string().trim().optional().nullable(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

export const listDocumentsSchema = paginationSchema.extend({
  documentType: z.nativeEnum(DocumentType).optional(),
  lowStock: z.coerce.boolean().optional(),
});

export const createReprintRequestSchema = z.object({
  documentId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  remarks: z.string().trim().optional().nullable(),
});

export const updateReprintRequestSchema = z.object({
  status: z.nativeEnum(ReprintRequestStatus),
  remarks: z.string().trim().optional().nullable(),
});

export const listReprintRequestsSchema = paginationSchema.extend({
  status: z.nativeEnum(ReprintRequestStatus).optional(),
  documentId: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type CreateReprintRequestInput = z.infer<
  typeof createReprintRequestSchema
>;

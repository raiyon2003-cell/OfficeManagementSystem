import { z } from "zod";
import { PurchaseRequestStatus } from "@/generated/prisma/client";
import { paginationSchema } from "@/lib/validations/common";

const purchaseRequestItemSchema = z.object({
  itemName: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
  description: z.string().trim().optional().nullable(),
});

export const createPurchaseRequestSchema = z.object({
  vendorId: z.string().optional().nullable(),
  budgetCode: z.string().trim().optional().nullable(),
  remarks: z.string().trim().optional().nullable(),
  items: z.array(purchaseRequestItemSchema).min(1, "At least one item is required"),
});

export const updatePurchaseRequestSchema = z.object({
  status: z.nativeEnum(PurchaseRequestStatus).optional(),
  vendorId: z.string().optional().nullable(),
  budgetCode: z.string().trim().optional().nullable(),
  remarks: z.string().trim().optional().nullable(),
  items: z.array(purchaseRequestItemSchema).optional(),
});

export const listPurchaseRequestsSchema = paginationSchema.extend({
  status: z.nativeEnum(PurchaseRequestStatus).optional(),
  requestedById: z.string().optional(),
  vendorId: z.string().optional(),
});

export const approvePurchaseRequestSchema = z.object({
  comments: z.string().trim().optional().nullable(),
});

export const rejectPurchaseRequestSchema = z.object({
  comments: z.string().trim().min(1, "Rejection reason is required"),
});

export type CreatePurchaseRequestInput = z.infer<
  typeof createPurchaseRequestSchema
>;

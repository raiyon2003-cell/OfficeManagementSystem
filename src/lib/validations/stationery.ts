import { z } from "zod";
import { StationeryItemStatus } from "@/generated/prisma/client";
import { paginationSchema } from "@/lib/validations/common";

export const createStationeryItemSchema = z.object({
  sku: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().optional().nullable(),
  unit: z.string().trim().min(1),
  currentStock: z.coerce.number().int().min(0).default(0),
  minStockLevel: z.coerce.number().int().min(0).default(0),
  reorderLevel: z.coerce.number().int().min(0).default(0),
  unitPrice: z.coerce.number().min(0).default(0),
  location: z.string().trim().optional().nullable(),
  status: z.nativeEnum(StationeryItemStatus).optional(),
});

export const updateStationeryItemSchema = createStationeryItemSchema
  .partial()
  .omit({ sku: true });

export const listStationeryItemsSchema = paginationSchema.extend({
  lowStock: z.coerce.boolean().optional(),
  status: z.nativeEnum(StationeryItemStatus).optional(),
});

export const createStationeryIssuanceSchema = z.object({
  itemId: z.string().min(1),
  employeeId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  purpose: z.string().trim().optional().nullable(),
});

export const listStationeryIssuanceSchema = paginationSchema.extend({
  itemId: z.string().optional(),
  employeeId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateStationeryIssuanceInput = z.infer<
  typeof createStationeryIssuanceSchema
>;

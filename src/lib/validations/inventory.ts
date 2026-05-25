import { z } from "zod";
import {
  InventoryCategoryType,
  InventoryItemStatus,
  StockMovementType,
} from "@/generated/prisma/client";
import { paginationSchema } from "@/lib/validations/common";

export const createInventoryCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().optional().nullable(),
  type: z.nativeEnum(InventoryCategoryType),
});

export const createInventoryItemSchema = z.object({
  sku: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().optional().nullable(),
  categoryId: z.string().min(1),
  vendorId: z.string().optional().nullable(),
  unit: z.string().trim().min(1),
  currentStock: z.coerce.number().int().min(0).default(0),
  minStockLevel: z.coerce.number().int().min(0).default(0),
  maxStockLevel: z.coerce.number().int().min(0).optional().nullable(),
  reorderLevel: z.coerce.number().int().min(0).default(0),
  unitPrice: z.coerce.number().min(0).default(0),
  location: z.string().trim().optional().nullable(),
  status: z.nativeEnum(InventoryItemStatus).optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema
  .partial()
  .omit({ sku: true });

export const listInventoryItemsSchema = paginationSchema.extend({
  categoryId: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  status: z.nativeEnum(InventoryItemStatus).optional(),
});

export const createStockMovementSchema = z.object({
  itemId: z.string().min(1),
  type: z.nativeEnum(StockMovementType),
  quantity: z.coerce.number().int().min(1),
  reason: z.string().trim().optional().nullable(),
  reference: z.string().trim().optional().nullable(),
});

export const listStockMovementsSchema = paginationSchema.extend({
  itemId: z.string().optional(),
  type: z.nativeEnum(StockMovementType).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateInventoryItemInput = z.infer<
  typeof createInventoryItemSchema
>;
export type CreateStockMovementInput = z.infer<
  typeof createStockMovementSchema
>;

import { z } from "zod";
import { VendorStatus } from "@/generated/prisma/client";
import { paginationSchema } from "@/lib/validations/common";

export const createVendorCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().optional().nullable(),
});

export const createVendorSchema = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(200),
  categoryId: z.string().min(1),
  contactPerson: z.string().trim().optional().nullable(),
  email: z.email().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: z.string().trim().optional().nullable(),
  postalCode: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
  taxId: z.string().trim().optional().nullable(),
  paymentTerms: z.string().trim().optional().nullable(),
  bankName: z.string().trim().optional().nullable(),
  accountNumber: z.string().trim().optional().nullable(),
  ifscCode: z.string().trim().optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  status: z.nativeEnum(VendorStatus).optional(),
  notes: z.string().trim().optional().nullable(),
});

export const updateVendorSchema = createVendorSchema.partial().omit({ code: true });

export const listVendorsSchema = paginationSchema.extend({
  categoryId: z.string().optional(),
  status: z.nativeEnum(VendorStatus).optional(),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;

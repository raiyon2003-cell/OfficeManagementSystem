import { z } from "zod";
import { OfficeExpenseCategory } from "@/generated/prisma/client";
import { paginationSchema } from "@/lib/validations/common";

export const createExpenseSchema = z.object({
  category: z.nativeEnum(OfficeExpenseCategory),
  amount: z.coerce.number().min(0.01),
  description: z.string().trim().min(1),
  expenseDate: z.coerce.date({ error: "Invalid expense date" }),
  vendorId: z.string().optional().nullable(),
  receiptUrl: z.string().url().optional().nullable(),
});

export const listExpensesSchema = paginationSchema.extend({
  category: z.nativeEnum(OfficeExpenseCategory).optional(),
  vendorId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const expenseSummarySchema = z.object({
  year: z.coerce.number().int().min(2000).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

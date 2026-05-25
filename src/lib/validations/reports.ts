import { z } from "zod";
import { ReportType } from "@/generated/prisma/client";
import { paginationSchema, optionalDateRangeSchema } from "@/lib/validations/common";

export const listReportsSchema = paginationSchema.extend({
  type: z.nativeEnum(ReportType).optional(),
  status: z.enum(["PENDING", "GENERATING", "COMPLETED", "FAILED"]).optional(),
});

export const generateReportSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.nativeEnum(ReportType),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const reportTypeQuerySchema = optionalDateRangeSchema.extend({
  roomId: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.string().optional(),
});

export const exportReportSchema = z.object({
  type: z.nativeEnum(ReportType),
  format: z.enum(["pdf", "excel", "csv"]),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;

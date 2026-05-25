import { z } from "zod";
import { paginationSchema } from "@/lib/validations/common";

export const listActivityLogsSchema = paginationSchema.extend({
  userId: z.string().optional(),
  module: z.string().optional(),
  action: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type ListActivityLogsInput = z.infer<typeof listActivityLogsSchema>;

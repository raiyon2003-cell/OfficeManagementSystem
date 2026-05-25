import { z } from "zod";
import { PAGINATION_DEFAULTS } from "@/lib/constants";

export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .default(PAGINATION_DEFAULTS.page),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(
      PAGINATION_DEFAULTS.maxLimit,
      `Limit cannot exceed ${PAGINATION_DEFAULTS.maxLimit}`,
    )
    .default(PAGINATION_DEFAULTS.limit),
  search: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date({ error: "Invalid start date" }),
    endDate: z.coerce.date({ error: "Invalid end date" }),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Start date must be before or equal to end date",
    path: ["endDate"],
  });

export const optionalDateRangeSchema = z
  .object({
    startDate: z.coerce.date({ error: "Invalid start date" }).optional(),
    endDate: z.coerce.date({ error: "Invalid end date" }).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }

      return true;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["endDate"],
    },
  );

export type PaginationInput = z.infer<typeof paginationSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;

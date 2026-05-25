import { z } from "zod";
import { paginationSchema } from "@/lib/validations/common";

export const listNotificationsSchema = paginationSchema.extend({
  unreadOnly: z.coerce.boolean().optional(),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;

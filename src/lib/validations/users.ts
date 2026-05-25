import { z } from "zod";
import { ROLES } from "@/lib/constants";
import { paginationSchema } from "@/lib/validations/common";

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().optional().nullable(),
  department: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listUsersSchema = paginationSchema.extend({
  role: z.nativeEnum(ROLES).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const assignRolesSchema = z.object({
  roleIds: z.array(z.string().min(1)).min(1, "At least one role is required"),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;

import { z } from "zod";

export const updateRolePermissionsSchema = z.object({
  permissionIds: z
    .array(z.string().min(1))
    .min(1, "At least one permission is required"),
});

export type UpdateRolePermissionsInput = z.infer<
  typeof updateRolePermissionsSchema
>;

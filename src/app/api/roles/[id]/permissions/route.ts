import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  resolveParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { updateRolePermissionsSchema } from "@/lib/validations/roles";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const PATCH = withPermission(
  PERMISSIONS.SETTINGS_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, updateRolePermissionsSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const role = await prisma.role.findUnique({ where: { id } });

    if (!role) {
      return error("Role not found", { code: "NOT_FOUND", status: 404 });
    }

    if (role.isSystem) {
      return error("Cannot modify system role permissions", {
        code: "SYSTEM_ROLE",
        status: 403,
      });
    }

    const permissions = await prisma.permission.findMany({
      where: { id: { in: parsed.data.permissionIds } },
    });

    if (permissions.length !== parsed.data.permissionIds.length) {
      return error("One or more permissions not found", {
        code: "PERMISSION_NOT_FOUND",
        status: 400,
      });
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.rolePermission.createMany({
        data: parsed.data.permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
      }),
    ]);

    const updated = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      tableName: "role_permissions",
      recordId: id,
      newValues: { permissionIds: parsed.data.permissionIds },
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE_ROLE_PERMISSIONS",
      module: "roles",
      entityType: "Role",
      entityId: id,
      ipAddress: ip,
    });

    return success(updated, { message: "Role permissions updated" });
  },
);

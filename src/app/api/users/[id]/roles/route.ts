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
import { assignRolesSchema } from "@/lib/validations/users";
import { logActivity, logAudit } from "@/lib/services/audit.service";
import { serializeUser } from "@/lib/api/serializers/user";

export const POST = withPermission(
  PERMISSIONS.USERS_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, assignRolesSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const targetUser = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!targetUser) {
      return error("User not found", { code: "NOT_FOUND", status: 404 });
    }

    const roles = await prisma.role.findMany({
      where: { id: { in: parsed.data.roleIds } },
    });

    if (roles.length !== parsed.data.roleIds.length) {
      return error("One or more roles not found", {
        code: "ROLE_NOT_FOUND",
        status: 400,
      });
    }

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: id } }),
      prisma.userRole.createMany({
        data: parsed.data.roleIds.map((roleId) => ({ userId: id, roleId })),
      }),
    ]);

    const updated = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        roles: { include: { role: true } },
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      tableName: "user_roles",
      recordId: id,
      newValues: { roleIds: parsed.data.roleIds },
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "ASSIGN_ROLES",
      module: "users",
      entityType: "User",
      entityId: id,
      metadata: { roleIds: parsed.data.roleIds },
      ipAddress: ip,
    });

    if (!updated) {
      return error("User not found", { code: "NOT_FOUND", status: 404 });
    }

    return success(serializeUser(updated), { message: "Roles assigned" });
  },
);

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
import { updateUserSchema } from "@/lib/validations/users";
import { logActivity, logAudit } from "@/lib/services/audit.service";
import { serializeUser } from "@/lib/api/serializers/user";

export const GET = withPermission(
  PERMISSIONS.USERS_READ,
  async (_request, { params }) => {
    const { id } = await resolveParams(params);

    const dbUser = await prisma.user.findFirst({
      where: { id, deletedAt: null },
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

    if (!dbUser) {
      return error("User not found", { code: "NOT_FOUND", status: 404 });
    }

    return success(serializeUser(dbUser));
  },
);

export const PATCH = withPermission(
  PERMISSIONS.USERS_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, updateUserSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return error("User not found", { code: "NOT_FOUND", status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        isActive: true,
        updatedAt: true,
        roles: { include: { role: true } },
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      tableName: "users",
      recordId: id,
      oldValues: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        isActive: existing.isActive,
      },
      newValues: parsed.data as Record<string, unknown>,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE_USER",
      module: "users",
      entityType: "User",
      entityId: id,
      ipAddress: ip,
    });

    return success(serializeUser({ ...updated, createdAt: existing.createdAt }), {
      message: "User updated",
    });
  },
);

export const DELETE = withPermission(
  PERMISSIONS.USERS_DELETE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const ip = getClientIp(request);

    if (id === user.id) {
      return error("Cannot delete your own account", {
        code: "SELF_DELETE",
        status: 400,
      });
    }

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return error("User not found", { code: "NOT_FOUND", status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await logAudit({
      userId: user.id,
      action: "SOFT_DELETE",
      tableName: "users",
      recordId: id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "DELETE_USER",
      module: "users",
      entityType: "User",
      entityId: id,
      ipAddress: ip,
    });

    return success({ deleted: true }, { message: "User deleted" });
  },
);

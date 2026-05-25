import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, paginated, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/api/helpers";
import { hashPassword } from "@/lib/auth/password";
import { appRoleToRoleName } from "@/lib/auth/role-mapping";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { createUserSchema } from "@/lib/validations/auth";
import { listUsersSchema } from "@/lib/validations/users";
import { logActivity, logAudit } from "@/lib/services/audit.service";
import { serializeUser, serializeUsers } from "@/lib/api/serializers/user";

export const GET = withPermission(PERMISSIONS.USERS_READ, async (request) => {
  const parsed = parseSearchParams(request, listUsersSchema);
  if (!parsed.success) return parsed.response;

  const { page, limit, search, sortBy, sortOrder, role, status } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(role
      ? {
          roles: {
            some: {
              role: { name: appRoleToRoleName(role) ?? undefined },
            },
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { department: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.UserOrderByWithRelationInput = sortBy
    ? { [sortBy]: sortOrder }
    : { createdAt: sortOrder };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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
        roles: {
          include: { role: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return paginated(serializeUsers(users), { page, limit, total });
});

export const POST = withPermission(
  PERMISSIONS.USERS_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createUserSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const { email, password, firstName, lastName, role, departmentId } =
      parsed.data;

    const roleName = appRoleToRoleName(role);
    if (!roleName) {
      return error("Invalid role for user creation", {
        code: "INVALID_ROLE",
        status: 400,
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return error("Email already in use", {
        code: "EMAIL_EXISTS",
        status: 409,
      });
    }

    const dbRole = await prisma.role.findUnique({ where: { name: roleName } });
    if (!dbRole) {
      return error("Role not found in database", {
        code: "ROLE_NOT_FOUND",
        status: 400,
      });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        department: departmentId,
        roles: { create: [{ roleId: dbRole.id }] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        isActive: true,
        createdAt: true,
        roles: { include: { role: true } },
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "users",
      recordId: newUser.id,
      newValues: { email: newUser.email, firstName, lastName },
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CREATE_USER",
      module: "users",
      entityType: "User",
      entityId: newUser.id,
      ipAddress: ip,
    });

    return success(serializeUser(newUser), {
      message: "User created",
      status: 201,
    });
  },
);

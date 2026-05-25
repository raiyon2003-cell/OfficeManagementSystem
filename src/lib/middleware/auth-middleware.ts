import type { NextRequest } from "next/server";
import { error } from "@/lib/api-response";
import type { Permission } from "@/lib/constants";
import { ROLES } from "@/lib/constants";
import {
  getPermissionsForRole,
  hasAnyPermission,
  hasPermission,
} from "@/lib/auth/permissions";
import { getSessionFromRequestWithUser } from "@/lib/auth/session";
import type { AuthUser, Role } from "@/types";

type RouteContext = {
  params: Promise<Record<string, string | string[]>>;
};

export type AuthenticatedHandler = (
  request: NextRequest,
  context: RouteContext & { user: AuthUser },
) => Promise<Response> | Response;

export type RouteHandler = (
  request: NextRequest,
  context: RouteContext,
) => Promise<Response> | Response;

function unauthorized(message = "Unauthorized") {
  return error(message, { code: "UNAUTHORIZED", status: 401 });
}

function forbidden(message = "Forbidden") {
  return error(message, { code: "FORBIDDEN", status: 403 });
}

export function withAuth(handler: AuthenticatedHandler): RouteHandler {
  return async (request, context) => {
    const session = await getSessionFromRequestWithUser(request);

    if (!session) {
      return unauthorized();
    }

    return handler(request, {
      ...context,
      user: session.user,
    });
  };
}

export function withPermission(
  permission: Permission,
  handler: AuthenticatedHandler,
): RouteHandler {
  return withAuth(async (request, context) => {
    if (!hasPermission(context.user.role, permission)) {
      return forbidden("Insufficient permissions");
    }

    return handler(request, context);
  });
}

export function withAnyPermission(
  permissions: Permission[],
  handler: AuthenticatedHandler,
): RouteHandler {
  return withAuth(async (request, context) => {
    if (!hasAnyPermission(context.user.role, permissions)) {
      return forbidden("Insufficient permissions");
    }

    return handler(request, context);
  });
}

export function withRole(role: Role, handler: AuthenticatedHandler): RouteHandler {
  return withAuth(async (request, context) => {
    if (context.user.role !== role) {
      return forbidden("Insufficient role");
    }

    return handler(request, context);
  });
}

export function withRoles(roles: Role[], handler: AuthenticatedHandler): RouteHandler {
  return withAuth(async (request, context) => {
    if (!roles.includes(context.user.role)) {
      return forbidden("Insufficient role");
    }

    return handler(request, context);
  });
}

export function withMinimumRole(
  minimumRole: Role,
  handler: AuthenticatedHandler,
): RouteHandler {
  const roleHierarchy: Role[] = [
    ROLES.EMPLOYEE,
    ROLES.FINANCE,
    ROLES.MANAGER,
    ROLES.HR,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
  ];

  return withAuth(async (request, context) => {
    const userLevel = roleHierarchy.indexOf(context.user.role);
    const requiredLevel = roleHierarchy.indexOf(minimumRole);

    if (userLevel < requiredLevel) {
      return forbidden("Insufficient role");
    }

    return handler(request, context);
  });
}

export { getPermissionsForRole };

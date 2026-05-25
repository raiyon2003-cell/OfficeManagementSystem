import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export interface LogAuditInput {
  userId?: string | null;
  action: string;
  tableName: string;
  recordId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export interface LogActivityInput {
  userId?: string | null;
  action: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

function toJsonValue(
  value?: Record<string, unknown> | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === null) {
    return Prisma.JsonNull;
  }

  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

export async function logAudit(input: LogAuditInput) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      tableName: input.tableName,
      recordId: input.recordId,
      oldValues: toJsonValue(input.oldValues),
      newValues: toJsonValue(input.newValues),
      ipAddress: input.ipAddress ?? null,
    },
  });
}

export async function logActivity(input: LogActivityInput) {
  return prisma.activityLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      module: input.module,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: toJsonValue(input.metadata),
      ipAddress: input.ipAddress ?? null,
    },
  });
}

export async function getAuditLogs(options?: {
  userId?: string;
  tableName?: string;
  recordId?: string;
  page?: number;
  limit?: number;
}) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    ...(options?.userId ? { userId: options.userId } : {}),
    ...(options?.tableName ? { tableName: options.tableName } : {}),
    ...(options?.recordId ? { recordId: options.recordId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function getActivityLogs(options?: {
  userId?: string;
  module?: string;
  page?: number;
  limit?: number;
}) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    ...(options?.userId ? { userId: options.userId } : {}),
    ...(options?.module ? { module: options.module } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { data, total, page, limit };
}

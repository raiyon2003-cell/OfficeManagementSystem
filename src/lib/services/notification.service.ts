import { prisma } from "@/lib/prisma";
import { NotificationType, Prisma } from "@/generated/prisma/client";
import { PAGINATION_DEFAULTS } from "@/lib/constants";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
}

const NOTIFICATION_TYPE_MAP: Record<string, NotificationType> = {
  info: NotificationType.INFO,
  warning: NotificationType.WARNING,
  success: NotificationType.SUCCESS,
  error: NotificationType.ERROR,
  approval: NotificationType.APPROVAL,
  reminder: NotificationType.REMINDER,
  system: NotificationType.SYSTEM,
};

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

export function resolveNotificationType(
  type?: string | NotificationType,
): NotificationType {
  if (!type) {
    return NotificationType.INFO;
  }

  if (Object.values(NotificationType).includes(type as NotificationType)) {
    return type as NotificationType;
  }

  return NOTIFICATION_TYPE_MAP[type.toLowerCase()] ?? NotificationType.INFO;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: resolveNotificationType(input.type),
      link: input.link ?? null,
      metadata: toJsonValue(input.metadata),
    },
  });
}

export async function createNotifications(
  inputs: CreateNotificationInput[],
) {
  return prisma.notification.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: resolveNotificationType(input.type),
      link: input.link ?? null,
      metadata: toJsonValue(input.metadata),
    })),
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    return null;
  }

  if (notification.isRead) {
    return notification;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
    },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

export async function getUserNotifications(
  userId: string,
  options?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  },
) {
  const page = options?.page ?? PAGINATION_DEFAULTS.page;
  const limit = options?.limit ?? PAGINATION_DEFAULTS.limit;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(options?.unreadOnly ? { isRead: false } : {}),
  };

  const [data, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    }),
  ]);

  return {
    data,
    total,
    unreadCount,
    page,
    limit,
  };
}

export async function deleteNotification(
  notificationId: string,
  userId: string,
) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    return null;
  }

  return prisma.notification.delete({
    where: { id: notificationId },
  });
}

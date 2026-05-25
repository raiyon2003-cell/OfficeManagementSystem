import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, paginated, success } from "@/lib/api-response";
import { hasBookingConflict } from "@/lib/api/booking-utils";
import {
  getClientIp,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import {
  createBookingSchema,
  listBookingsSchema,
} from "@/lib/validations/bookings";
import { logActivity, logAudit } from "@/lib/services/audit.service";
import { createNotification } from "@/lib/services/notification.service";

export const GET = withPermission(PERMISSIONS.BOOKINGS_READ, async (request) => {
  const parsed = parseSearchParams(request, listBookingsSchema);
  if (!parsed.success) return parsed.response;

  const {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    date,
    dateFrom,
    dateTo,
    roomId,
    status,
    organizerId,
  } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.RoomBookingWhereInput = {
    deletedAt: null,
    ...(date ? { date } : {}),
    ...(dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
    ...(roomId ? { roomId } : {}),
    ...(status ? { status } : {}),
    ...(organizerId ? { organizerId } : {}),
    ...(search
      ? { title: { contains: search, mode: "insensitive" } }
      : {}),
  };

  const orderBy: Prisma.RoomBookingOrderByWithRelationInput = sortBy
    ? { [sortBy]: sortOrder }
    : { date: sortOrder };

  const [bookings, total] = await Promise.all([
    prisma.roomBooking.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        room: { select: { id: true, name: true, location: true } },
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        equipmentRequests: { include: { equipment: true } },
      },
    }),
    prisma.roomBooking.count({ where }),
  ]);

  return paginated(bookings, { page, limit, total });
});

export const POST = withPermission(
  PERMISSIONS.BOOKINGS_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createBookingSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const { equipmentIds, ...data } = parsed.data;

    const room = await prisma.meetingRoom.findFirst({
      where: { id: data.roomId, deletedAt: null },
    });
    if (!room) {
      return error("Meeting room not found", { code: "NOT_FOUND", status: 404 });
    }

    const conflict = await hasBookingConflict(
      data.roomId,
      data.date,
      data.startTime,
      data.endTime,
    );
    if (conflict) {
      return error("Time slot conflicts with existing booking", {
        code: "BOOKING_CONFLICT",
        status: 409,
      });
    }

    const booking = await prisma.roomBooking.create({
      data: {
        ...data,
        organizerId: user.id,
        equipmentRequests: equipmentIds?.length
          ? {
              create: equipmentIds.map((eq) => ({
                equipmentId: eq.equipmentId,
                quantity: eq.quantity,
              })),
            }
          : undefined,
      },
      include: {
        room: true,
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        equipmentRequests: { include: { equipment: true } },
      },
    });

    await createNotification({
      userId: user.id,
      title: "Booking created",
      message: `Your booking "${booking.title}" has been submitted`,
      type: "INFO",
      link: `/bookings/${booking.id}`,
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "room_bookings",
      recordId: booking.id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CREATE_BOOKING",
      module: "bookings",
      entityType: "RoomBooking",
      entityId: booking.id,
      ipAddress: ip,
    });

    return success(booking, { message: "Booking created", status: 201 });
  },
);

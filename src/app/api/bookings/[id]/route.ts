import type { NextRequest } from "next/server";
import { BookingStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { hasBookingConflict } from "@/lib/api/booking-utils";
import {
  getClientIp,
  parseJsonBody,
  resolveParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { updateBookingSchema } from "@/lib/validations/bookings";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(
  PERMISSIONS.BOOKINGS_READ,
  async (_request, { params }) => {
    const { id } = await resolveParams(params);

    const booking = await prisma.roomBooking.findFirst({
      where: { id, deletedAt: null },
      include: {
        room: { include: { equipment: true } },
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        equipmentRequests: { include: { equipment: true } },
        recurringPattern: true,
      },
    });

    if (!booking) {
      return error("Booking not found", { code: "NOT_FOUND", status: 404 });
    }

    return success(booking);
  },
);

export const PATCH = withPermission(
  PERMISSIONS.BOOKINGS_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, updateBookingSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const existing = await prisma.roomBooking.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return error("Booking not found", { code: "NOT_FOUND", status: 404 });
    }

    const roomId = parsed.data.roomId ?? existing.roomId;
    const date = parsed.data.date ?? existing.date;
    const startTime = parsed.data.startTime ?? existing.startTime;
    const endTime = parsed.data.endTime ?? existing.endTime;

    const conflict = await hasBookingConflict(
      roomId,
      date,
      startTime,
      endTime,
      id,
    );
    if (conflict) {
      return error("Time slot conflicts with existing booking", {
        code: "BOOKING_CONFLICT",
        status: 409,
      });
    }

    const booking = await prisma.roomBooking.update({
      where: { id },
      data: parsed.data,
      include: {
        room: true,
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      tableName: "room_bookings",
      recordId: id,
      ipAddress: ip,
    });

    return success(booking, { message: "Booking updated" });
  },
);

export const DELETE = withPermission(
  PERMISSIONS.BOOKINGS_WRITE,
  async (request, { user, params }) => {
    const { id } = await resolveParams(params);
    const ip = getClientIp(request);

    const existing = await prisma.roomBooking.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return error("Booking not found", { code: "NOT_FOUND", status: 404 });
    }

    const booking = await prisma.roomBooking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        deletedAt: new Date(),
      },
    });

    await logAudit({
      userId: user.id,
      action: "CANCEL",
      tableName: "room_bookings",
      recordId: id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CANCEL_BOOKING",
      module: "bookings",
      entityType: "RoomBooking",
      entityId: id,
      ipAddress: ip,
    });

    return success(booking, { message: "Booking cancelled" });
  },
);

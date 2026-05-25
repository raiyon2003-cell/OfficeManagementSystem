import type { NextRequest } from "next/server";
import { addDays, addWeeks, addMonths, getDay } from "date-fns";
import { RecurringFrequency } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { hasBookingConflict } from "@/lib/api/booking-utils";
import { getClientIp, parseJsonBody } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { createRecurringBookingSchema } from "@/lib/validations/bookings";
import { logActivity, logAudit } from "@/lib/services/audit.service";

function getNextDate(
  current: Date,
  frequency: RecurringFrequency,
  interval: number,
): Date {
  switch (frequency) {
    case RecurringFrequency.DAILY:
      return addDays(current, interval);
    case RecurringFrequency.WEEKLY:
      return addWeeks(current, interval);
    case RecurringFrequency.BIWEEKLY:
      return addWeeks(current, interval * 2);
    case RecurringFrequency.MONTHLY:
      return addMonths(current, interval);
    default:
      return addWeeks(current, interval);
  }
}

export const POST = withPermission(
  PERMISSIONS.BOOKINGS_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createRecurringBookingSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const {
      frequency,
      interval,
      daysOfWeek,
      endDate,
      occurrences,
      equipmentIds,
      ...bookingData
    } = parsed.data;

    const room = await prisma.meetingRoom.findFirst({
      where: { id: bookingData.roomId, deletedAt: null },
    });
    if (!room) {
      return error("Meeting room not found", { code: "NOT_FOUND", status: 404 });
    }

    const createdBookings = [];
    let currentDate = bookingData.date;
    let count = 0;
    const maxOccurrences = occurrences ?? 52;

    while (count < maxOccurrences) {
      if (endDate && currentDate > endDate) break;

      if (
        daysOfWeek?.length &&
        !daysOfWeek.includes(getDay(currentDate))
      ) {
        currentDate = getNextDate(currentDate, frequency, interval);
        continue;
      }

      const conflict = await hasBookingConflict(
        bookingData.roomId,
        currentDate,
        bookingData.startTime,
        bookingData.endTime,
      );

      if (!conflict) {
        const booking = await prisma.roomBooking.create({
          data: {
            ...bookingData,
            date: currentDate,
            organizerId: user.id,
            equipmentRequests: equipmentIds?.length
              ? {
                  create: equipmentIds.map((eq) => ({
                    equipmentId: eq.equipmentId,
                    quantity: eq.quantity,
                  })),
                }
              : undefined,
            ...(count === 0
              ? {
                  recurringPattern: {
                    create: {
                      frequency,
                      interval,
                      daysOfWeek: daysOfWeek ?? [],
                      endDate,
                      occurrences,
                    },
                  },
                }
              : {}),
          },
        });
        createdBookings.push(booking);
      }

      count++;
      currentDate = getNextDate(currentDate, frequency, interval);
    }

    if (createdBookings.length === 0) {
      return error("No bookings could be created due to conflicts", {
        code: "NO_BOOKINGS_CREATED",
        status: 409,
      });
    }

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "recurring_bookings",
      recordId: createdBookings[0].id,
      newValues: { count: createdBookings.length, frequency },
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CREATE_RECURRING_BOOKING",
      module: "bookings",
      entityType: "RecurringBooking",
      entityId: createdBookings[0].id,
      metadata: { count: createdBookings.length },
      ipAddress: ip,
    });

    return success(
      { bookings: createdBookings, count: createdBookings.length },
      { message: "Recurring bookings created", status: 201 },
    );
  },
);

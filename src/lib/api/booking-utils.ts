import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/generated/prisma/client";
import { timesOverlap } from "@/lib/api/helpers";

export async function hasBookingConflict(
  roomId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeBookingId?: string,
): Promise<boolean> {
  const bookings = await prisma.roomBooking.findMany({
    where: {
      roomId,
      date,
      deletedAt: null,
      status: {
        notIn: [BookingStatus.CANCELLED, BookingStatus.REJECTED],
      },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { startTime: true, endTime: true },
  });

  return bookings.some((b) =>
    timesOverlap(startTime, endTime, b.startTime, b.endTime),
  );
}

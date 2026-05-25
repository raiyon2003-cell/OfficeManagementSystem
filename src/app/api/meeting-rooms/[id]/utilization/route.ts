import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/generated/prisma/client";
import { error, success } from "@/lib/api-response";
import { parseSearchParams, resolveParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { utilizationQuerySchema } from "@/lib/validations/bookings";

export const GET = withPermission(
  PERMISSIONS.MEETING_ROOMS_READ,
  async (request, { params }) => {
    const { id } = await resolveParams(params);
    const parsed = parseSearchParams(request, utilizationQuerySchema);
    if (!parsed.success) return parsed.response;

    const room = await prisma.meetingRoom.findFirst({
      where: { id, deletedAt: null },
    });

    if (!room) {
      return error("Meeting room not found", { code: "NOT_FOUND", status: 404 });
    }

    const { startDate, endDate } = parsed.data;

    const bookings = await prisma.roomBooking.findMany({
      where: {
        roomId: id,
        deletedAt: null,
        date: { gte: startDate, lte: endDate },
        status: {
          in: [
            BookingStatus.APPROVED,
            BookingStatus.CONFIRMED,
            BookingStatus.COMPLETED,
          ],
        },
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        attendees: true,
        status: true,
      },
      orderBy: { date: "asc" },
    });

    const totalBookings = bookings.length;
    const totalAttendees = bookings.reduce((sum, b) => sum + b.attendees, 0);

    const daysDiff =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    return success({
      roomId: id,
      roomName: room.name,
      period: { startDate, endDate },
      totalBookings,
      totalAttendees,
      averageBookingsPerDay: daysDiff > 0 ? totalBookings / daysDiff : 0,
      utilizationRate:
        daysDiff > 0 ? Math.min((totalBookings / daysDiff) * 100, 100) : 0,
      bookings,
    });
  },
);

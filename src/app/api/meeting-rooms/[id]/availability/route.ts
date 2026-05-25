import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/generated/prisma/client";
import { error, success } from "@/lib/api-response";
import { parseSearchParams, resolveParams, timesOverlap } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { availabilityQuerySchema } from "@/lib/validations/bookings";

export const GET = withPermission(
  PERMISSIONS.MEETING_ROOMS_READ,
  async (request, { params }) => {
    const { id } = await resolveParams(params);
    const parsed = parseSearchParams(request, availabilityQuerySchema);
    if (!parsed.success) return parsed.response;

    const room = await prisma.meetingRoom.findFirst({
      where: { id, deletedAt: null },
    });

    if (!room) {
      return error("Meeting room not found", { code: "NOT_FOUND", status: 404 });
    }

    const { date, startTime, endTime } = parsed.data;

    const bookings = await prisma.roomBooking.findMany({
      where: {
        roomId: id,
        date,
        deletedAt: null,
        status: {
          notIn: [BookingStatus.CANCELLED, BookingStatus.REJECTED],
        },
      },
      select: { id: true, startTime: true, endTime: true, title: true },
    });

    const conflicts = bookings.filter((b) =>
      timesOverlap(startTime, endTime, b.startTime, b.endTime),
    );

    return success({
      roomId: id,
      date,
      startTime,
      endTime,
      available: conflicts.length === 0,
      conflicts,
    });
  },
);

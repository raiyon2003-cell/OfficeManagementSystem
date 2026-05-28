import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, paginated, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  parseSearchParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import {
  createMeetingRoomSchema,
  listMeetingRoomsSchema,
} from "@/lib/validations/bookings";
import { logActivity, logAudit } from "@/lib/services/audit.service";

async function ensureDefaultMeetingRooms() {
  const existingRooms = await prisma.meetingRoom.count({
    where: { deletedAt: null },
  });

  if (existingRooms > 0) return;

  await prisma.meetingRoom.createMany({
    data: [
      {
        name: "Conference Room A",
        capacity: 8,
        location: "First Floor",
        floor: "1",
        building: "Main Office",
        description: "General meetings and team syncs",
      },
      {
        name: "Conference Room B",
        capacity: 12,
        location: "First Floor",
        floor: "1",
        building: "Main Office",
        description: "Client calls and presentations",
      },
      {
        name: "Board Room",
        capacity: 16,
        location: "Second Floor",
        floor: "2",
        building: "Main Office",
        description: "Leadership and board meetings",
      },
      {
        name: "Huddle Room",
        capacity: 4,
        location: "Ground Floor",
        floor: "G",
        building: "Main Office",
        description: "Quick standups and pair sessions",
      },
    ],
    skipDuplicates: true,
  });
}

export const GET = withPermission(
  PERMISSIONS.MEETING_ROOMS_READ,
  async (request) => {
    await ensureDefaultMeetingRooms();

    const parsed = parseSearchParams(request, listMeetingRoomsSchema);
    if (!parsed.success) return parsed.response;

    const { page, limit, search, sortBy, sortOrder, status, location } =
      parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.MeetingRoomWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.MeetingRoomOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { name: "asc" };

    const [rooms, total] = await Promise.all([
      prisma.meetingRoom.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          equipment: true,
          _count: { select: { bookings: true } },
        },
      }),
      prisma.meetingRoom.count({ where }),
    ]);

    return paginated(rooms, { page, limit, total });
  },
);

export const POST = withPermission(
  PERMISSIONS.MEETING_ROOMS_WRITE,
  async (request: NextRequest, { user }) => {
    const parsed = await parseJsonBody(request, createMeetingRoomSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const { equipment, ...data } = parsed.data;

    const room = await prisma.meetingRoom.create({
      data: {
        ...data,
        equipment: equipment?.length
          ? { create: equipment }
          : undefined,
      },
      include: { equipment: true },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      tableName: "meeting_rooms",
      recordId: room.id,
      newValues: { name: room.name },
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "CREATE_MEETING_ROOM",
      module: "meeting_rooms",
      entityType: "MeetingRoom",
      entityId: room.id,
      ipAddress: ip,
    });

    return success(room, { message: "Meeting room created", status: 201 });
  },
);

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/generated/prisma/client";
import { error, success } from "@/lib/api-response";
import {
  getClientIp,
  parseJsonBody,
  resolveParams,
} from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { updateMeetingRoomSchema } from "@/lib/validations/bookings";
import { logActivity, logAudit } from "@/lib/services/audit.service";

export const GET = withPermission(
  PERMISSIONS.MEETING_ROOMS_READ,
  async (_request, { params }) => {
    const { id } = await resolveParams(params);

    const room = await prisma.meetingRoom.findFirst({
      where: { id, deletedAt: null },
      include: { equipment: true },
    });

    if (!room) {
      return error("Meeting room not found", { code: "NOT_FOUND", status: 404 });
    }

    return success(room);
  },
);

export const PATCH = withPermission(
  PERMISSIONS.MEETING_ROOMS_WRITE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, updateMeetingRoomSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const existing = await prisma.meetingRoom.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return error("Meeting room not found", { code: "NOT_FOUND", status: 404 });
    }

    const { equipment, ...roomData } = parsed.data;

    const room = await prisma.meetingRoom.update({
      where: { id },
      data: roomData,
      include: { equipment: true },
    });

    if (equipment?.length) {
      await prisma.roomEquipment.deleteMany({ where: { roomId: id } });
      await prisma.roomEquipment.createMany({
        data: equipment.map((item) => ({ ...item, roomId: id })),
      });
    }

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      tableName: "meeting_rooms",
      recordId: id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE_MEETING_ROOM",
      module: "meeting_rooms",
      entityType: "MeetingRoom",
      entityId: id,
      ipAddress: ip,
    });

    return success(room, { message: "Meeting room updated" });
  },
);

export const DELETE = withPermission(
  PERMISSIONS.MEETING_ROOMS_WRITE,
  async (request, { user, params }) => {
    const { id } = await resolveParams(params);
    const ip = getClientIp(request);

    const existing = await prisma.meetingRoom.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return error("Meeting room not found", { code: "NOT_FOUND", status: 404 });
    }

    const activeBookings = await prisma.roomBooking.count({
      where: {
        roomId: id,
        deletedAt: null,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.CONFIRMED],
        },
        date: { gte: new Date() },
      },
    });

    if (activeBookings > 0) {
      return error("Cannot delete room with active bookings", {
        code: "ACTIVE_BOOKINGS",
        status: 400,
      });
    }

    await prisma.meetingRoom.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      userId: user.id,
      action: "SOFT_DELETE",
      tableName: "meeting_rooms",
      recordId: id,
      ipAddress: ip,
    });

    return success({ deleted: true }, { message: "Meeting room deleted" });
  },
);

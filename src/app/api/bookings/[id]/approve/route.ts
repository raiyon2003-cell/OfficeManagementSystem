import type { NextRequest } from "next/server";
import {
  BookingStatus,
  ApprovalEntityType,
  ApprovalStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { error, success } from "@/lib/api-response";
import { getClientIp, parseJsonBody, resolveParams } from "@/lib/api/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";
import { approveBookingSchema } from "@/lib/validations/bookings";
import { logActivity, logAudit } from "@/lib/services/audit.service";
import { createNotification } from "@/lib/services/notification.service";

export const POST = withPermission(
  PERMISSIONS.BOOKINGS_APPROVE,
  async (request: NextRequest, { user, params }) => {
    const { id } = await resolveParams(params);
    const parsed = await parseJsonBody(request, approveBookingSchema);
    if (!parsed.success) return parsed.response;

    const ip = getClientIp(request);
    const booking = await prisma.roomBooking.findFirst({
      where: { id, deletedAt: null },
    });

    if (!booking) {
      return error("Booking not found", { code: "NOT_FOUND", status: 404 });
    }

    if (booking.status !== BookingStatus.PENDING) {
      return error("Booking is not pending approval", {
        code: "INVALID_STATUS",
        status: 400,
      });
    }

    const { approved, rejectionReason } = parsed.data;
    const newStatus = approved ? BookingStatus.APPROVED : BookingStatus.REJECTED;

    const updated = await prisma.roomBooking.update({
      where: { id },
      data: {
        status: newStatus,
        approvedById: user.id,
        approvedAt: new Date(),
        rejectionReason: approved ? null : rejectionReason,
      },
    });

    await prisma.approval.create({
      data: {
        entityType: ApprovalEntityType.ROOM_BOOKING,
        entityId: id,
        approverId: user.id,
        status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        comments: rejectionReason,
      },
    });

    await createNotification({
      userId: booking.organizerId,
      title: approved ? "Booking approved" : "Booking rejected",
      message: `Your booking "${booking.title}" has been ${approved ? "approved" : "rejected"}`,
      type: approved ? "SUCCESS" : "WARNING",
      link: `/bookings/${id}`,
    });

    await logAudit({
      userId: user.id,
      action: approved ? "APPROVE" : "REJECT",
      tableName: "room_bookings",
      recordId: id,
      ipAddress: ip,
    });

    await logActivity({
      userId: user.id,
      action: approved ? "APPROVE_BOOKING" : "REJECT_BOOKING",
      module: "bookings",
      entityType: "RoomBooking",
      entityId: id,
      ipAddress: ip,
    });

    return success(updated, {
      message: approved ? "Booking approved" : "Booking rejected",
    });
  },
);

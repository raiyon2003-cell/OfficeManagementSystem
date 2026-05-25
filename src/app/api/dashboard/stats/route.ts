import {
  BookingStatus,
  InventoryItemStatus,
  PurchaseRequestStatus,
  VisitorStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api-response";
import { PERMISSIONS } from "@/lib/constants";
import { withPermission } from "@/lib/middleware/auth-middleware";

export const GET = withPermission(PERMISSIONS.DASHBOARD_READ, async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalUsers,
    activeUsers,
    todayVisitors,
    pendingVisitors,
    checkedInVisitors,
    totalMeetingRooms,
    todayBookings,
    pendingBookings,
    lowStockItems,
    pendingPurchaseRequests,
    unreadNotifications,
    totalExpenses,
    monthlyExpenses,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, isActive: true } }),
    prisma.visitor.count({
      where: { scheduledDate: { gte: today, lt: tomorrow } },
    }),
    prisma.visitor.count({ where: { status: VisitorStatus.PENDING } }),
    prisma.visitor.count({ where: { status: VisitorStatus.CHECKED_IN } }),
    prisma.meetingRoom.count({ where: { deletedAt: null } }),
    prisma.roomBooking.count({
      where: {
        date: { gte: today, lt: tomorrow },
        deletedAt: null,
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.REJECTED] },
      },
    }),
    prisma.roomBooking.count({
      where: { status: BookingStatus.PENDING, deletedAt: null },
    }),
    prisma.inventoryItem.count({
      where: {
        deletedAt: null,
        status: {
          in: [InventoryItemStatus.LOW_STOCK, InventoryItemStatus.OUT_OF_STOCK],
        },
      },
    }),
    prisma.purchaseRequest.count({
      where: {
        status: PurchaseRequestStatus.PENDING,
        deletedAt: null,
      },
    }),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.officeExpense.aggregate({ _sum: { amount: true } }),
    prisma.officeExpense.aggregate({
      where: {
        expenseDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
          lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  return success({
    users: { total: totalUsers, active: activeUsers },
    visitors: {
      today: todayVisitors,
      pending: pendingVisitors,
      checkedIn: checkedInVisitors,
    },
    meetingRooms: { total: totalMeetingRooms, todayBookings, pendingBookings },
    inventory: { lowStockItems },
    purchaseRequests: { pending: pendingPurchaseRequests },
    notifications: { unread: unreadNotifications },
    expenses: {
      total: Number(totalExpenses._sum.amount ?? 0),
      thisMonth: Number(monthlyExpenses._sum.amount ?? 0),
    },
  });
});

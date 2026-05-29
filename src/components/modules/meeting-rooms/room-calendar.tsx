"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { EventInput } from "@fullcalendar/core";

import { Skeleton } from "@/components/ui/skeleton";
import { BOOKING_STATUS_COLORS } from "@/lib/brand";
import type { RoomBooking } from "@/types/entities";

const CalendarView = dynamic(
  () => import("./calendar-view").then((mod) => mod.CalendarView),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[500px] w-full rounded-lg" />,
  },
);

interface RoomCalendarProps {
  bookings?: RoomBooking[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (booking: RoomBooking) => void;
  isLoading?: boolean;
}

export function RoomCalendar({
  bookings = [],
  onDateClick,
  onEventClick,
  isLoading,
}: RoomCalendarProps) {
  const events: EventInput[] = useMemo(
    () =>
      bookings.map((booking) => ({
        id: booking.id,
        title: booking.title,
        start: `${booking.date}T${booking.startTime}`,
        end: `${booking.date}T${booking.endTime}`,
        extendedProps: { booking },
        backgroundColor:
          booking.status === "CONFIRMED"
            ? BOOKING_STATUS_COLORS.CONFIRMED
            : booking.status === "PENDING"
              ? BOOKING_STATUS_COLORS.PENDING
              : BOOKING_STATUS_COLORS.default,
      })),
    [bookings],
  );

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full rounded-lg" />;
  }

  return (
    <div className="rounded-lg border bg-card p-2 sm:p-4 [&_.fc]:text-sm">
      <CalendarView
        events={events}
        onDateClick={onDateClick}
        onEventClick={onEventClick}
      />
    </div>
  );
}

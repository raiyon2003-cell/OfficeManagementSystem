"use client";

import "@/styles/fullcalendar.css";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";

import type { RoomBooking } from "@/types/entities";

interface CalendarViewProps {
  events: EventInput[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (booking: RoomBooking) => void;
}

export function CalendarView({
  events,
  onDateClick,
  onEventClick,
}: CalendarViewProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      events={events}
      slotMinTime="07:00:00"
      slotMaxTime="21:00:00"
      allDaySlot={false}
      height="auto"
      contentHeight={500}
      nowIndicator
      dateClick={(info) => onDateClick?.(info.date)}
      eventClick={(info) => {
        const booking = info.event.extendedProps.booking as RoomBooking;
        onEventClick?.(booking);
      }}
    />
  );
}

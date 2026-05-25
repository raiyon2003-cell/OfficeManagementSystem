"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { RoomCalendar } from "@/components/modules/meeting-rooms/room-calendar";
import { RoomCard } from "@/components/modules/meeting-rooms/room-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMeetingRooms } from "@/lib/api/meeting-rooms";
import { getBookings } from "@/lib/api/bookings";

export default function MeetingRoomsPage() {
  const [view, setView] = useState<"calendar" | "rooms">("calendar");

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["meeting-rooms"],
    queryFn: () => getMeetingRooms({ limit: 50 }),
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings", "calendar"],
    queryFn: () => getBookings({ limit: 100 }),
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Meeting Rooms"
        description="View room availability and manage bookings"
        actions={
          <div className="flex gap-2">
            <Button
              variant={view === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("calendar")}
            >
              Calendar
            </Button>
            <Button
              variant={view === "rooms" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("rooms")}
            >
              Rooms
            </Button>
            <Button asChild>
              <Link href="/meeting-rooms/book">
                <Plus className="mr-2 h-4 w-4" />
                Book Room
              </Link>
            </Button>
          </div>
        }
      />

      {view === "calendar" ? (
        <RoomCalendar
          bookings={bookings?.data ?? []}
          isLoading={bookingsLoading}
          onDateClick={() => {}}
        />
      ) : roomsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms?.data.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </PageTransition>
  );
}

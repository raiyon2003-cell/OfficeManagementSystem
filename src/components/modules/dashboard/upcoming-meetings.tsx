"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import type { RoomBooking } from "@/types/entities";

interface UpcomingMeetingsProps {
  meetings?: RoomBooking[];
  isLoading?: boolean;
}

export function UpcomingMeetings({
  meetings = [],
  isLoading,
}: UpcomingMeetingsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Upcoming Meetings</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/meeting-rooms">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <EmptyState
            title="No upcoming meetings"
            description="Book a meeting room to get started."
            icon={<Calendar className="h-6 w-6 text-muted-foreground" />}
            actionLabel="Book a room"
            onAction={() => {
              window.location.href = "/meeting-rooms/book";
            }}
            className="py-6"
          />
        ) : (
          <ul className="space-y-3">
            {meetings.map((meeting) => (
              <li
                key={meeting.id}
                className="flex items-start justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {meeting.room?.name ?? "Room"} ·{" "}
                    {format(new Date(meeting.date), "MMM d")} ·{" "}
                    {meeting.startTime}–{meeting.endTime}
                  </p>
                </div>
                <StatusBadge status={meeting.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

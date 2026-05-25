"use client";

import Link from "next/link";
import { Building2, Users } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MeetingRoom } from "@/types/entities";

interface RoomCardProps {
  room: MeetingRoom;
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  AVAILABLE: "success",
  OCCUPIED: "warning",
  MAINTENANCE: "secondary",
  OUT_OF_SERVICE: "destructive",
};

export function RoomCard({ room }: RoomCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{room.name}</CardTitle>
          <Badge variant={statusVariant[room.status] ?? "outline"}>
            {room.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{room.location}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Capacity: {room.capacity}</span>
        </div>
        {room.floor && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>
              {room.building ? `${room.building}, ` : ""}Floor {room.floor}
            </span>
          </div>
        )}
        {room.description && (
          <p className="line-clamp-2 text-muted-foreground">{room.description}</p>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/meeting-rooms/book?roomId=${room.id}`}>Book room</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

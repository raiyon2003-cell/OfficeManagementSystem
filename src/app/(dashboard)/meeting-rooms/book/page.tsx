"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { BookingForm } from "@/components/modules/meeting-rooms/booking-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMeetingRooms } from "@/lib/api/meeting-rooms";
import { createBooking } from "@/lib/api/bookings";
import type { BookingInput } from "@/lib/api/bookings";

export default function BookMeetingRoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRoomId = searchParams.get("roomId") ?? undefined;

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["meeting-rooms"],
    queryFn: () => getMeetingRooms({ limit: 50 }),
  });

  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      toast.success("Meeting room booked successfully");
      router.push("/meeting-rooms");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Booking failed"),
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Book Meeting Room"
        description="Reserve a room for your meeting"
      />
      <Card className="max-w-xl">
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <BookingForm
              rooms={rooms?.data ?? []}
              defaultRoomId={defaultRoomId}
              onSubmit={(data: BookingInput) => {
                mutation.mutate(data);
              }}
              isSubmitting={mutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}

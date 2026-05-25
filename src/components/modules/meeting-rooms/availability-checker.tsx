"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { checkAvailability } from "@/lib/api/bookings";

interface AvailabilityCheckerProps {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  enabled?: boolean;
}

export function AvailabilityChecker({
  roomId,
  date,
  startTime,
  endTime,
  enabled = true,
}: AvailabilityCheckerProps) {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "unavailable">(
    "idle",
  );

  useEffect(() => {
    if (!enabled || !roomId || !date || !startTime || !endTime) {
      setStatus("idle");
      return;
    }

    const timer = setTimeout(async () => {
      setStatus("checking");
      try {
        const result = await checkAvailability({ roomId, date, startTime, endTime });
        setStatus(result.available ? "available" : "unavailable");
      } catch {
        setStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [roomId, date, startTime, endTime, enabled]);

  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        status === "available" &&
          "border-[#588157]/30 bg-[#588157]/10 text-[#344e41] dark:border-[#588157]/40 dark:bg-[#588157]/20 dark:text-[#a8d4a6]",
        status === "unavailable" &&
          "border-destructive/30 bg-destructive/10 text-destructive",
        status === "checking" && "border-muted bg-muted/50 text-muted-foreground",
      )}
    >
      {status === "checking" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking availability...
        </>
      )}
      {status === "available" && (
        <>
          <CheckCircle2 className="h-4 w-4" />
          Room is available for this time slot
        </>
      )}
      {status === "unavailable" && (
        <>
          <XCircle className="h-4 w-4" />
          Room is not available — choose another time
        </>
      )}
    </div>
  );
}

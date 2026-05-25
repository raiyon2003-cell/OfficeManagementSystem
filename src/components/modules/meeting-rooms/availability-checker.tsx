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
        status === "available" && "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
        status === "unavailable" && "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
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

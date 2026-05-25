"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Visitor } from "@/types/entities";

interface CheckInDialogProps {
  visitor: Visitor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  mode: "check-in" | "check-out";
  isLoading?: boolean;
}

export function CheckInDialog({
  visitor,
  open,
  onOpenChange,
  onConfirm,
  mode,
  isLoading,
}: CheckInDialogProps) {
  const isCheckIn = mode === "check-in";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCheckIn ? "Check in visitor" : "Check out visitor"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCheckIn
              ? `Confirm check-in for ${visitor?.fullName ?? "this visitor"}?`
              : `Confirm check-out for ${visitor?.fullName ?? "this visitor"}?`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading
              ? "Processing..."
              : isCheckIn
                ? "Check in"
                : "Check out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

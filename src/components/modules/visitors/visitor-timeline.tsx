"use client";

import { format } from "date-fns";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import type { VisitorLog } from "@/types/entities";

interface VisitorTimelineProps {
  logs?: VisitorLog[];
  isLoading?: boolean;
}

const actionLabels: Record<string, string> = {
  CREATED: "Visitor registered",
  UPDATED: "Details updated",
  APPROVED: "Visit approved",
  REJECTED: "Visit rejected",
  CHECKED_IN: "Checked in",
  CHECKED_OUT: "Checked out",
  PASS_ISSUED: "Pass issued",
  PASS_RETURNED: "Pass returned",
  CANCELLED: "Visit cancelled",
  REMARK_ADDED: "Remark added",
};

export function VisitorTimeline({ logs = [], isLoading }: VisitorTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Visitor timeline events will appear here."
      />
    );
  }

  return (
    <ol className="relative border-l border-muted pl-6">
      {logs.map((log) => (
        <li key={log.id} className="mb-6 last:mb-0">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {actionLabels[log.action] ?? log.action}
            </p>
            <p className="text-xs text-muted-foreground">
              {log.performedBy
                ? `${log.performedBy.firstName} ${log.performedBy.lastName} · `
                : ""}
              {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

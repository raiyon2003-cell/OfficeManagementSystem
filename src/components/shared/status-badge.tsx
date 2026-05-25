import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { AppStatus } from "@/types";

const statusConfig: Record<
  AppStatus,
  { label: string; variant: NonNullable<BadgeProps["variant"]> }
> = {
  ACTIVE: { label: "Active", variant: "success" },
  INACTIVE: { label: "Inactive", variant: "secondary" },
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "success" },
  IN_PROGRESS: { label: "In Progress", variant: "info" },
  DRAFT: { label: "Draft", variant: "outline" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  SCHEDULED: { label: "Scheduled", variant: "info" },
  CHECKED_IN: { label: "Checked In", variant: "success" },
  CHECKED_OUT: { label: "Checked Out", variant: "secondary" },
};

interface StatusBadgeProps {
  status: AppStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toUpperCase() as AppStatus;
  const config = statusConfig[normalized] ?? {
    label: status.replace(/_/g, " "),
    variant: "outline" as const,
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

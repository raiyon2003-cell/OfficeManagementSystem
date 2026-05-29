"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import type { NotificationItem } from "@/types";
import { PAGINATION_DEFAULTS } from "@/lib/constants";

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () =>
      getNotifications({ page: 1, limit: PAGINATION_DEFAULTS.limit * 2 }),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to mark as read"),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to mark all as read",
      ),
  });

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay updated on activity across the office"
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<Bell className="h-6 w-6 text-muted-foreground" />}
              title="No notifications"
              description="You're all caught up. New alerts will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex w-full flex-col gap-2 px-4 py-4 text-left transition-colors hover:bg-muted/50",
                  !notification.isRead && "bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Badge variant="default" className="shrink-0">
                      New
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{notification.type}</span>
                  <time>
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </time>
                </div>
                {notification.link && (
                  <span className="text-xs text-primary">
                    View details →
                  </span>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </PageTransition>
  );
}

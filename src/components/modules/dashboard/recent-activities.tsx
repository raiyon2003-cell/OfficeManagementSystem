"use client";

import { formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Activity {
  id: string;
  action: string;
  module: string;
  userName?: string;
  createdAt: string;
}

interface RecentActivitiesProps {
  activities?: Activity[];
  isLoading?: boolean;
}

export function RecentActivities({
  activities = [],
  isLoading,
}: RecentActivitiesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="System activities will show up here."
            className="py-6"
          />
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <ul className="space-y-4">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-medium">{activity.action}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {activity.module}
                      {activity.userName ? ` · ${activity.userName}` : ""}
                    </span>
                    <time>
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

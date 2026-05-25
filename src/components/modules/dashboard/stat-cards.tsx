"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  Package,
  Percent,
  UserCheck,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  visitorsToday?: number;
  upcomingMeetings?: number;
  roomOccupancyPercent?: number;
  lowStockCount?: number;
  pendingApprovals?: number;
  isLoading?: boolean;
}

const stats = [
  {
    key: "visitorsToday" as const,
    title: "Visitors Today",
    icon: UserCheck,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  {
    key: "upcomingMeetings" as const,
    title: "Upcoming Meetings",
    icon: Calendar,
    color: "text-violet-600",
    bg: "bg-violet-500/10",
  },
  {
    key: "roomOccupancyPercent" as const,
    title: "Room Occupancy",
    icon: Percent,
    suffix: "%",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  {
    key: "lowStockCount" as const,
    title: "Low Stock Items",
    icon: Package,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
  {
    key: "pendingApprovals" as const,
    title: "Pending Approvals",
    icon: AlertCircle,
    color: "text-rose-600",
    bg: "bg-rose-500/10",
  },
];

export function StatCards({
  visitorsToday = 0,
  upcomingMeetings = 0,
  roomOccupancyPercent = 0,
  lowStockCount = 0,
  pendingApprovals = 0,
  isLoading,
}: StatCardsProps) {
  const values = {
    visitorsToday,
    upcomingMeetings,
    roomOccupancyPercent,
    lowStockCount,
    pendingApprovals,
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.key}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const value = values[stat.key];

        return (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={cn("rounded-lg p-2", stat.bg)}>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {value}
                  {stat.suffix ?? ""}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

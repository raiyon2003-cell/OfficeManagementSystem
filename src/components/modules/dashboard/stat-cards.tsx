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
    color: "text-brand-lime",
    bg: "bg-brand-lime/10",
    border: "border-brand-lime/20",
  },
  {
    key: "upcomingMeetings" as const,
    title: "Upcoming Meetings",
    icon: Calendar,
    color: "text-brand-steel-teal",
    bg: "bg-brand-steel-teal/10",
    border: "border-brand-steel-teal/20",
  },
  {
    key: "roomOccupancyPercent" as const,
    title: "Room Occupancy",
    icon: Percent,
    suffix: "%",
    color: "text-brand-charcoal dark:text-brand-lime",
    bg: "bg-brand-charcoal/10",
    border: "border-brand-charcoal/20",
  },
  {
    key: "lowStockCount" as const,
    title: "Low Stock Items",
    icon: Package,
    color: "text-brand-olive",
    bg: "bg-brand-olive/15",
    border: "border-brand-olive/25",
  },
  {
    key: "pendingApprovals" as const,
    title: "Pending Approvals",
    icon: AlertCircle,
    color: "text-brand-deep-teal dark:text-brand-steel-teal",
    bg: "bg-brand-deep-teal/10",
    border: "border-brand-deep-teal/20",
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
          <Card key={s.key} className="border-border/60">
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
            whileHover={{ y: -2 }}
          >
            <Card className={cn("border transition-shadow hover:shadow-md", stat.border)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={cn("rounded-lg border p-2", stat.bg, stat.border)}>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">
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

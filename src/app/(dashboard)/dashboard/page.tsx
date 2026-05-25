"use client";

import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { StatCards } from "@/components/modules/dashboard/stat-cards";
import { VisitorsChart } from "@/components/modules/dashboard/visitors-chart";
import { ExpensesChart } from "@/components/modules/dashboard/expenses-chart";
import { RecentActivities } from "@/components/modules/dashboard/recent-activities";
import { UpcomingMeetings } from "@/components/modules/dashboard/upcoming-meetings";
import { LowStockAlerts } from "@/components/modules/dashboard/low-stock-alerts";
import { getDashboardOverview } from "@/lib/api/dashboard";

export default function DashboardPage() {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: getDashboardOverview,
    refetchInterval: 30000,
  });

  const loading = isLoading || isFetching;

  return (
    <PageTransition className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of office operations and key metrics"
      />

      <StatCards
        visitorsToday={data?.visitorsToday}
        upcomingMeetings={data?.upcomingMeetings}
        roomOccupancyPercent={data?.roomOccupancyPercent}
        lowStockCount={data?.lowStockCount}
        pendingApprovals={data?.pendingApprovals}
        isLoading={isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <VisitorsChart data={data?.visitorsByDay} isLoading={isLoading} />
        <ExpensesChart data={data?.expensesByMonth} isLoading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <UpcomingMeetings
          meetings={data?.upcomingMeetingsList}
          isLoading={isLoading}
        />
        <LowStockAlerts
          items={data?.lowStockItems?.map((item) => ({
            id: item.id,
            name: item.name,
            sku: "sku" in item ? item.sku : undefined,
            currentStock: item.currentStock,
            reorderLevel: "reorderLevel" in item ? item.reorderLevel : undefined,
          }))}
          isLoading={isLoading}
        />
        <RecentActivities
          activities={data?.recentActivities}
          isLoading={isLoading}
        />
      </div>
    </PageTransition>
  );
}

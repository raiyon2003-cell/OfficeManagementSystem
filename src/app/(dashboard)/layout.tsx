"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "@/lib/api/notifications";

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getNotifications({ limit: 1, page: 1, unreadOnly: true }),
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const unreadCount = notifications?.meta.total ?? 0;

  return (
    <DashboardLayout
      role={user.role}
      user={{
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      }}
      notificationCount={unreadCount}
    >
      {children}
    </DashboardLayout>
  );
}

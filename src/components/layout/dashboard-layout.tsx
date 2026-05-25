"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Role } from "@/types";
import { ROLES } from "@/lib/constants";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: Role;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
    role?: string;
  };
  notificationCount?: number;
  className?: string;
}

export function DashboardLayout({
  children,
  role = ROLES.EMPLOYEE,
  user,
  notificationCount,
  className,
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden lg:flex">
        <Sidebar
          role={role}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0" title="Navigation menu">
          <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-1 flex-col">
        <Header
          user={user}
          notificationCount={notificationCount}
          showMenuButton
          onMenuClick={() => setMobileOpen(true)}
        />
        <main
          className={cn(
            "flex-1 overflow-auto p-4 sm:p-6 lg:p-8",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

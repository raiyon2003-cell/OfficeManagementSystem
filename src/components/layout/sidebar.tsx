"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  Package,
  PenLine,
  Settings,
  ShoppingCart,
  Users,
  UserCheck,
  Warehouse,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Role } from "@/types";
import { APP_NAME, ROLES } from "@/lib/constants";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Visitors", href: "/visitors", icon: UserCheck },
  { title: "Meeting Rooms", href: "/meeting-rooms", icon: Building2 },
  { title: "Inventory", href: "/inventory", icon: Warehouse },
  { title: "Stationery", href: "/stationery", icon: PenLine },
  { title: "Documents", href: "/documents", icon: FileText },
  { title: "Vendors", href: "/vendors", icon: Package },
  { title: "Purchase Requests", href: "/purchase-requests", icon: ShoppingCart },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Users & Roles", href: "/users", icon: Users, adminOnly: true },
  { title: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  role?: Role;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({
  role = ROLES.EMPLOYEE,
  collapsed = false,
  onCollapsedChange,
  onNavigate,
  className,
}: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) =>
      !item.adminOnly ||
      role === ROLES.ADMIN ||
      role === ROLES.SUPER_ADMIN,
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-64",
          className,
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border/60 px-4",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent shadow-sm">
                <Building2 className="h-5 w-5 text-sidebar-accent-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight text-sidebar-foreground">
                  {APP_NAME}
                </span>
                <span className="text-[10px] font-normal uppercase tracking-wider text-sidebar-muted">
                  CONTEG
                </span>
              </div>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent">
              <Building2 className="h-5 w-5 text-sidebar-accent-foreground" />
            </Link>
          )}
          {onCollapsedChange && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 shrink-0 text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground",
                collapsed && "absolute -right-3 top-4 z-10 rounded-full border border-sidebar-border bg-sidebar shadow-md",
              )}
              onClick={() => onCollapsedChange(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft
                className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
              />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/75 hover:bg-white/10 hover:text-sidebar-foreground",
                    collapsed && "justify-center px-2",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-sidebar-accent-foreground")} />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <React.Fragment key={item.href}>{linkContent}</React.Fragment>;
            })}
          </nav>
        </ScrollArea>

        {!collapsed && (
          <>
            <Separator className="bg-sidebar-border/50" />
            <div className="p-4">
              <p className="text-xs text-sidebar-muted">
                Office Management System
              </p>
            </div>
          </>
        )}
      </aside>
    </TooltipProvider>
  );
}

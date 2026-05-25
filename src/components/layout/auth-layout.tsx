import type { ReactNode } from "react";
import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function AuthLayout({
  children,
  title = "Office Manager",
  description = "Sign in to manage your office operations",
  className,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12 dark:bg-background">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div
        className={cn(
          "w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8",
          className
        )}
      >
        {children}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Office Management System
      </p>
    </div>
  );
}

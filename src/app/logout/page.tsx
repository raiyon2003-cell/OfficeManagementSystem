"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { logout } from "@/lib/api/auth";
import { useAuth } from "@/hooks/use-auth";

export default function LogoutPage() {
  const router = useRouter();
  const { logout: clearAuth } = useAuth();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    void (async () => {
      try {
        await logout();
      } catch {
        // Clear local session even if the API call fails.
      } finally {
        clearAuth();
        router.replace("/login");
      }
    })();
  }, [clearAuth, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner size="lg" />
    </div>
  );
}

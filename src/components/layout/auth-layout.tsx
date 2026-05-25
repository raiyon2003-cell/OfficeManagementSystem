"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Branded background */}
      <div className="brand-gradient-auth absolute inset-0" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #588157 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, #28666e 0%, transparent 40%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 mb-8 flex flex-col items-center gap-4 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#588157] text-white shadow-lg ring-4 ring-white/10">
          <Building2 className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#819171]">
            CONTEG
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          <p className="max-w-sm text-sm text-white/75">{description}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={cn(
          "brand-card-elevated relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-card p-6 shadow-2xl sm:p-8",
          className,
        )}
      >
        {children}
      </motion.div>

      <p className="relative z-10 mt-8 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} Office Management System
      </p>
    </div>
  );
}

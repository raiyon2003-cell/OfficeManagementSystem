"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { SearchInput } from "@/components/shared/search-input";
import { VisitorTable } from "@/components/modules/visitors/visitor-table";
import { CheckInDialog } from "@/components/modules/visitors/check-in-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getVisitors,
  checkInVisitor,
  checkOutVisitor,
} from "@/lib/api/visitors";
import type { Visitor } from "@/types/entities";
import { PAGINATION_DEFAULTS } from "@/lib/constants";

export default function VisitorsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [dialogVisitor, setDialogVisitor] = useState<Visitor | null>(null);
  const [dialogMode, setDialogMode] = useState<"check-in" | "check-out">("check-in");

  const { data, isLoading } = useQuery({
    queryKey: ["visitors", page, search, status],
    queryFn: () =>
      getVisitors({
        page,
        limit: PAGINATION_DEFAULTS.limit,
        search: search || undefined,
        status,
      }),
  });

  const checkInMutation = useMutation({
    mutationFn: checkInVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
      toast.success("Visitor checked in");
      setDialogVisitor(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Check-in failed"),
  });

  const checkOutMutation = useMutation({
    mutationFn: checkOutVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
      toast.success("Visitor checked out");
      setDialogVisitor(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Check-out failed"),
  });

  const openDialog = (visitor: Visitor, mode: "check-in" | "check-out") => {
    setDialogVisitor(visitor);
    setDialogMode(mode);
  };

  const handleConfirm = () => {
    if (!dialogVisitor) return;
    if (dialogMode === "check-in") {
      checkInMutation.mutate(dialogVisitor.id);
    } else {
      checkOutMutation.mutate(dialogVisitor.id);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Visitors"
        description="Manage visitor registrations and check-ins"
        actions={
          <Button asChild>
            <Link href="/visitors/new">
              <Plus className="mr-2 h-4 w-4" />
              Register Visitor
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search visitors..."
          className="sm:max-w-xs"
        />
        <Select
          value={status ?? "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="CHECKED_IN">Checked In</SelectItem>
            <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <VisitorTable
        visitors={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        pageSize={PAGINATION_DEFAULTS.limit}
        totalItems={data?.meta.total ?? 0}
        onPageChange={setPage}
        onCheckIn={(v) => openDialog(v, "check-in")}
        onCheckOut={(v) => openDialog(v, "check-out")}
      />

      <CheckInDialog
        visitor={dialogVisitor}
        open={!!dialogVisitor}
        onOpenChange={(open) => !open && setDialogVisitor(null)}
        onConfirm={handleConfirm}
        mode={dialogMode}
        isLoading={checkInMutation.isPending || checkOutMutation.isPending}
      />
    </PageTransition>
  );
}

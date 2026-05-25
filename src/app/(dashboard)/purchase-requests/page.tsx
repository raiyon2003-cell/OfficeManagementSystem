"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { RequestTable } from "@/components/modules/purchase-requests/request-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPurchaseRequests } from "@/lib/api/purchase-requests";
import { PAGINATION_DEFAULTS } from "@/lib/constants";

export default function PurchaseRequestsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-requests", page, status],
    queryFn: () =>
      getPurchaseRequests({
        page,
        limit: PAGINATION_DEFAULTS.limit,
        status,
      }),
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Purchase Requests"
        description="Submit and track procurement requests"
        actions={
          <Button asChild>
            <Link href="/purchase-requests/new">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
        }
      />

      <Select
        value={status ?? "all"}
        onValueChange={(v) => {
          setStatus(v === "all" ? undefined : v);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
          <SelectItem value="ORDERED">Ordered</SelectItem>
          <SelectItem value="DELIVERED">Delivered</SelectItem>
        </SelectContent>
      </Select>

      <RequestTable
        requests={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        pageSize={PAGINATION_DEFAULTS.limit}
        totalItems={data?.meta.total ?? 0}
        onPageChange={setPage}
      />
    </PageTransition>
  );
}

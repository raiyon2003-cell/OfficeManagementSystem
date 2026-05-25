"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { StationeryTable } from "@/components/modules/stationery/stationery-table";
import {
  IssuanceForm,
  type IssuanceFormValues,
} from "@/components/modules/stationery/issuance-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStationeryItems, issueStationery } from "@/lib/api/stationery";
import { PAGINATION_DEFAULTS } from "@/lib/constants";

export default function StationeryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["stationery", page],
    queryFn: () =>
      getStationeryItems({ page, limit: PAGINATION_DEFAULTS.limit }),
  });

  const issuanceMutation = useMutation({
    mutationFn: issueStationery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stationery"] });
      toast.success("Stationery issued successfully");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Issuance failed"),
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Stationery"
        description="Manage stationery inventory and issue items to employees"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StationeryTable
            items={data?.data ?? []}
            isLoading={isLoading}
            page={page}
            pageSize={PAGINATION_DEFAULTS.limit}
            totalItems={data?.meta.total ?? 0}
            onPageChange={setPage}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issue Stationery</CardTitle>
          </CardHeader>
          <CardContent>
            <IssuanceForm
              items={data?.data ?? []}
              onSubmit={async (values: IssuanceFormValues) => {
                await issuanceMutation.mutateAsync(values);
              }}
              isSubmitting={issuanceMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

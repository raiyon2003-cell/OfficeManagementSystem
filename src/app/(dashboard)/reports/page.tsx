"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { ReportFiltersForm } from "@/components/modules/reports/report-filters";
import { ExportButtons } from "@/components/modules/reports/export-buttons";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  generateReport,
  getReports,
  type ReportFilters,
} from "@/lib/api/reports";
import type { ReportDefinition } from "@/types/entities";

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters | null>(null);

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ["reports"],
    queryFn: () => getReports({ limit: 20 }),
  });

  const generateMutation = useMutation({
    mutationFn: generateReport,
    onSuccess: () => {
      toast.success("Report generation started");
      refetch();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Generation failed"),
  });

  const columns: DataTableColumn<ReportDefinition>[] = [
    {
      id: "type",
      header: "Type",
      cell: (row) => row.type.replace(/_/g, " "),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "createdAt",
      header: "Generated",
      cell: (row) => format(new Date(row.createdAt), "MMM d, yyyy h:mm a"),
    },
    {
      id: "fileUrl",
      header: "Download",
      cell: (row) =>
        row.fileUrl ? (
          <a
            href={row.fileUrl}
            className="text-sm text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </a>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export office management reports"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReportFiltersForm
            onSubmit={(f) => {
              setFilters(f);
              generateMutation.mutate(f);
            }}
            isLoading={generateMutation.isPending}
          />
          {filters && (
            <ExportButtons
              filters={filters}
              disabled={generateMutation.isPending}
            />
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Reports</h2>
        <DataTable
          columns={columns}
          data={reports?.data ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No reports generated yet"
        />
      </div>
    </PageTransition>
  );
}

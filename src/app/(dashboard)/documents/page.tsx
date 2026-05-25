"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { DocumentForm } from "@/components/modules/documents/document-form";
import { ReprintForm } from "@/components/modules/documents/reprint-form";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDocuments,
  getReprintRequests,
  createDocument,
  createReprintRequest,
} from "@/lib/api/documents";
import type { DocumentInventory, ReprintRequest } from "@/types/entities";
import { PAGINATION_DEFAULTS } from "@/lib/constants";

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", page],
    queryFn: () => getDocuments({ page, limit: PAGINATION_DEFAULTS.limit }),
  });

  const { data: reprints, isLoading: reprintsLoading } = useQuery({
    queryKey: ["documents", "reprints"],
    queryFn: () => getReprintRequests({ limit: 20 }),
  });

  const docColumns: DataTableColumn<DocumentInventory>[] = [
    { id: "name", header: "Name", accessorKey: "name", sortable: true },
    {
      id: "type",
      header: "Type",
      cell: (row) => row.type.replace(/_/g, " "),
    },
    { id: "currentStock", header: "Stock", accessorKey: "currentStock" },
    { id: "location", header: "Location", cell: (row) => row.location ?? "—" },
  ];

  const reprintColumns: DataTableColumn<ReprintRequest>[] = [
    {
      id: "document",
      header: "Document",
      cell: (row) => row.document?.name ?? "—",
    },
    { id: "quantity", header: "Qty", accessorKey: "quantity" },
    { id: "purpose", header: "Purpose", accessorKey: "purpose" },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const createDocMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document added");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to add document"),
  });

  const reprintMutation = useMutation({
    mutationFn: createReprintRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", "reprints"] });
      toast.success("Reprint request submitted");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Request failed"),
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Documents"
        description="Manage document inventory and reprint requests"
      />

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Document Inventory</TabsTrigger>
          <TabsTrigger value="reprints">Reprint Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DataTable
                columns={docColumns}
                data={documents?.data ?? []}
                getRowId={(row) => row.id}
                isLoading={isLoading}
                pagination={{
                  page,
                  pageSize: PAGINATION_DEFAULTS.limit,
                  totalItems: documents?.meta.total ?? 0,
                  onPageChange: setPage,
                }}
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Document</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentForm
                  onSubmit={async (data) => {
                    await createDocMutation.mutateAsync(data);
                  }}
                  isSubmitting={createDocMutation.isPending}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reprints" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DataTable
                columns={reprintColumns}
                data={reprints?.data ?? []}
                getRowId={(row) => row.id}
                isLoading={reprintsLoading}
                emptyTitle="No reprint requests"
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">New Reprint Request</CardTitle>
              </CardHeader>
              <CardContent>
                <ReprintForm
                  documents={documents?.data ?? []}
                  onSubmit={async (data) => {
                    await reprintMutation.mutateAsync(data);
                  }}
                  isSubmitting={reprintMutation.isPending}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}

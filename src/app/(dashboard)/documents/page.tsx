"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DocumentForm } from "@/components/modules/documents/document-form";
import { ReprintForm } from "@/components/modules/documents/reprint-form";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getDocuments,
  getReprintRequests,
  createDocument,
  updateDocument,
  deleteDocument,
  createReprintRequest,
} from "@/lib/api/documents";
import type { DocumentInventory, ReprintRequest } from "@/types/entities";
import { PAGINATION_DEFAULTS } from "@/lib/constants";

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editingDocument, setEditingDocument] = useState<DocumentInventory | null>(
    null,
  );
  const [deletingDocument, setDeletingDocument] = useState<DocumentInventory | null>(
    null,
  );

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
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingDocument(row)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => setDeletingDocument(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
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

  const updateDocMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateDocument>[1] }) =>
      updateDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document updated");
      setEditingDocument(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to update document"),
  });

  const deleteDocMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["documents", "reprints"] });
      toast.success("Document deleted");
      setDeletingDocument(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to delete document"),
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
                  onSubmit={(data) => {
                    createDocMutation.mutate(data);
                  }}
                  isSubmitting={createDocMutation.isPending}
                  submitLabel="Add Document"
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
                  onSubmit={(data) => {
                    reprintMutation.mutate(data);
                  }}
                  isSubmitting={reprintMutation.isPending}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingDocument} onOpenChange={(open) => !open && setEditingDocument(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <DocumentForm
            defaultValues={
              editingDocument
                ? {
                    name: editingDocument.name,
                    type: editingDocument.type,
                    currentStock: editingDocument.currentStock,
                    minStockLevel: editingDocument.minStockLevel,
                    location: editingDocument.location ?? "",
                  }
                : undefined
            }
            onSubmit={(data) => {
              if (!editingDocument) return;
              updateDocMutation.mutate({ id: editingDocument.id, data });
            }}
            isSubmitting={updateDocMutation.isPending}
            submitLabel="Update Document"
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingDocument}
        onOpenChange={(open) => !open && setDeletingDocument(null)}
        title="Delete document"
        description={`Are you sure you want to delete ${deletingDocument?.name}?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deletingDocument) return;
          deleteDocMutation.mutate(deletingDocument.id);
        }}
        isLoading={deleteDocMutation.isPending}
      />
    </PageTransition>
  );
}

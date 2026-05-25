"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { SearchInput } from "@/components/shared/search-input";
import { VendorTable } from "@/components/modules/vendors/vendor-table";
import { VendorForm } from "@/components/modules/vendors/vendor-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} from "@/lib/api/vendors";
import type { Vendor } from "@/types/entities";
import type { VendorInput } from "@/lib/api/vendors";
import { PAGINATION_DEFAULTS } from "@/lib/constants";

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState<Vendor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vendors", page, search],
    queryFn: () =>
      getVendors({
        page,
        limit: PAGINATION_DEFAULTS.limit,
        search: search || undefined,
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async (input: VendorInput) => {
      if (editing) {
        return updateVendor(editing.id, input);
      }
      return createVendor(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success(editing ? "Vendor updated" : "Vendor created");
      setFormOpen(false);
      setEditing(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor deleted");
      setDeleting(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Manage vendor contacts and information"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search vendors..."
        className="sm:max-w-xs"
      />

      <VendorTable
        vendors={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        pageSize={PAGINATION_DEFAULTS.limit}
        totalItems={data?.meta.total ?? 0}
        onPageChange={setPage}
        onEdit={(v) => {
          setEditing(v);
          setFormOpen(true);
        }}
        onDelete={setDeleting}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Vendor" : "Add Vendor"}
            </DialogTitle>
          </DialogHeader>
          <VendorForm
            defaultValues={editing ?? undefined}
            onSubmit={async (input) => {
              await saveMutation.mutateAsync(input);
            }}
            isSubmitting={saveMutation.isPending}
            submitLabel={editing ? "Update Vendor" : "Create Vendor"}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete vendor"
        description={`Are you sure you want to delete ${deleting?.name}?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        isLoading={deleteMutation.isPending}
      />
    </PageTransition>
  );
}

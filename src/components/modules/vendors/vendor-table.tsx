"use client";

import { Pencil, Trash2 } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import type { Vendor } from "@/types/entities";

interface VendorTableProps {
  vendors: Vendor[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (vendor: Vendor) => void;
}

export function VendorTable({
  vendors,
  isLoading,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onEdit,
  onDelete,
}: VendorTableProps) {
  const columns: DataTableColumn<Vendor>[] = [
    { id: "name", header: "Name", accessorKey: "name", sortable: true },
    {
      id: "contactPerson",
      header: "Contact",
      cell: (row) => row.contactPerson ?? "—",
    },
    { id: "email", header: "Email", cell: (row) => row.email ?? "—" },
    { id: "phone", header: "Phone", cell: (row) => row.phone ?? "—" },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <div className="flex gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => onDelete(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={vendors}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyTitle="No vendors"
      pagination={{ page, pageSize, totalItems, onPageChange }}
    />
  );
}

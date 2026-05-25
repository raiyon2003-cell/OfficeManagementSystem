"use client";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { StationeryItem } from "@/types/entities";

interface StationeryTableProps {
  items: StationeryItem[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function StationeryTable({
  items,
  isLoading,
  page,
  pageSize,
  totalItems,
  onPageChange,
}: StationeryTableProps) {
  const columns: DataTableColumn<StationeryItem>[] = [
    { id: "sku", header: "SKU", accessorKey: "sku", sortable: true },
    { id: "name", header: "Name", accessorKey: "name", sortable: true },
    {
      id: "currentStock",
      header: "Stock",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.currentStock}</span>
          {row.currentStock <= row.reorderLevel && (
            <Badge variant="warning">Low</Badge>
          )}
        </div>
      ),
      sortable: true,
    },
    { id: "unit", header: "Unit", accessorKey: "unit" },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status.includes("LOW") ? "warning" : "secondary"}>
          {row.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyTitle="No stationery items"
      pagination={{ page, pageSize, totalItems, onPageChange }}
    />
  );
}

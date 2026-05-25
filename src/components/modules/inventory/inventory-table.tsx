"use client";

import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { InventoryItem } from "@/types/entities";

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

function isLowStock(item: InventoryItem) {
  return item.currentStock <= item.reorderLevel;
}

export function InventoryTable({
  items,
  isLoading,
  page,
  pageSize,
  totalItems,
  onPageChange,
}: InventoryTableProps) {
  const columns: DataTableColumn<InventoryItem>[] = [
    {
      id: "sku",
      header: "SKU",
      accessorKey: "sku",
      sortable: true,
    },
    {
      id: "name",
      header: "Name",
      cell: (row) => (
        <Link href={`/inventory/${row.id}`} className="font-medium hover:underline">
          {row.name}
        </Link>
      ),
      sortable: true,
    },
    {
      id: "category",
      header: "Category",
      cell: (row) => row.category?.name ?? "—",
    },
    {
      id: "currentStock",
      header: "Stock",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.currentStock}</span>
          {isLowStock(row) && (
            <Badge variant="warning">Low</Badge>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      id: "unit",
      header: "Unit",
      accessorKey: "unit",
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <Badge
          variant={
            row.status === "LOW_STOCK" || row.status === "OUT_OF_STOCK"
              ? "warning"
              : "secondary"
          }
        >
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
      emptyTitle="No inventory items"
      emptyDescription="Add items to start tracking stock."
      pagination={{ page, pageSize, totalItems, onPageChange }}
    />
  );
}

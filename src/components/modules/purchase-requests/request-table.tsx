"use client";

import Link from "next/link";
import { format } from "date-fns";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { PurchaseRequest } from "@/types/entities";

interface RequestTableProps {
  requests: PurchaseRequest[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function RequestTable({
  requests,
  isLoading,
  page,
  pageSize,
  totalItems,
  onPageChange,
}: RequestTableProps) {
  const columns: DataTableColumn<PurchaseRequest>[] = [
    {
      id: "title",
      header: "Title",
      cell: (row) => (
        <Link
          href={`/purchase-requests/${row.id}`}
          className="font-medium hover:underline"
        >
          {row.title}
        </Link>
      ),
      sortable: true,
    },
    {
      id: "requestedBy",
      header: "Requested By",
      cell: (row) =>
        row.requestedBy
          ? `${row.requestedBy.firstName} ${row.requestedBy.lastName}`
          : "—",
    },
    {
      id: "totalAmount",
      header: "Total",
      cell: (row) => `$${Number(row.totalAmount).toLocaleString()}`,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "createdAt",
      header: "Created",
      cell: (row) => format(new Date(row.createdAt), "MMM d, yyyy"),
      sortable: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={requests}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyTitle="No purchase requests"
      pagination={{ page, pageSize, totalItems, onPageChange }}
    />
  );
}

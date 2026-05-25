"use client";

import Link from "next/link";
import { format } from "date-fns";
import { LogIn, LogOut, MoreHorizontal } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Visitor } from "@/types/entities";

interface VisitorTableProps {
  visitors: Visitor[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onCheckIn?: (visitor: Visitor) => void;
  onCheckOut?: (visitor: Visitor) => void;
}

export function VisitorTable({
  visitors,
  isLoading,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onCheckIn,
  onCheckOut,
}: VisitorTableProps) {
  const columns: DataTableColumn<Visitor>[] = [
    {
      id: "fullName",
      header: "Name",
      accessorKey: "fullName",
      sortable: true,
      cell: (row) => (
        <Link
          href={`/visitors/${row.id}`}
          className="font-medium hover:underline"
        >
          {row.fullName}
        </Link>
      ),
    },
    {
      id: "company",
      header: "Company",
      cell: (row) => row.company ?? "—",
    },
    {
      id: "phone",
      header: "Phone",
      accessorKey: "phone",
    },
    {
      id: "scheduledDate",
      header: "Visit Date",
      cell: (row) => format(new Date(row.scheduledDate), "MMM d, yyyy"),
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "actions",
      header: "",
      className: "w-12",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/visitors/${row.id}`}>View details</Link>
            </DropdownMenuItem>
            {row.status !== "CHECKED_IN" && onCheckIn && (
              <DropdownMenuItem onClick={() => onCheckIn(row)}>
                <LogIn className="mr-2 h-4 w-4" />
                Check in
              </DropdownMenuItem>
            )}
            {row.status === "CHECKED_IN" && onCheckOut && (
              <DropdownMenuItem onClick={() => onCheckOut(row)}>
                <LogOut className="mr-2 h-4 w-4" />
                Check out
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={visitors}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyTitle="No visitors found"
      emptyDescription="Register a new visitor or adjust your filters."
      pagination={{
        page,
        pageSize,
        totalItems,
        onPageChange,
      }}
    />
  );
}

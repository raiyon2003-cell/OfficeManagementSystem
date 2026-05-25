"use client";

import { format } from "date-fns";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/types";

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function UserTable({
  users,
  isLoading,
  page,
  pageSize,
  totalItems,
  onPageChange,
}: UserTableProps) {
  const columns: DataTableColumn<User>[] = [
    {
      id: "name",
      header: "Name",
      cell: (row) => (
        <span className="font-medium">
          {row.firstName} {row.lastName}
        </span>
      ),
      sortable: true,
    },
    { id: "email", header: "Email", accessorKey: "email" },
    {
      id: "role",
      header: "Role",
      cell: (row) => (
        <Badge variant="outline">
          {(row.role ?? "EMPLOYEE").replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      id: "department",
      header: "Department",
      cell: (row) => row.department ?? "—",
    },
    {
      id: "isActive",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isActive ? "success" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "lastLoginAt",
      header: "Last Login",
      cell: (row) =>
        row.lastLoginAt
          ? format(new Date(row.lastLoginAt), "MMM d, yyyy")
          : "Never",
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyTitle="No users found"
      pagination={{ page, pageSize, totalItems, onPageChange }}
    />
  );
}

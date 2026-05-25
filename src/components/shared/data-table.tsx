"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";

export type SortDirection = "asc" | "desc" | null;

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export interface DataTableSorting {
  columnId: string | null;
  direction: SortDirection;
  onSortChange: (columnId: string, direction: SortDirection) => void;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId?: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pagination?: DataTablePagination;
  sorting?: DataTableSorting;
  className?: string;
}

function getCellValue<T>(row: T, column: DataTableColumn<T>) {
  if (column.cell) {
    return column.cell(row);
  }

  if (column.accessorKey) {
    const value = row[column.accessorKey];
    return value != null ? String(value) : "—";
  }

  return "—";
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  isLoading = false,
  emptyTitle = "No results found",
  emptyDescription = "Try adjusting your filters or search query.",
  pagination,
  sorting,
  className,
}: DataTableProps<T>) {
  const handleSort = (columnId: string) => {
    if (!sorting) return;

    let nextDirection: SortDirection = "asc";
    if (sorting.columnId === columnId) {
      if (sorting.direction === "asc") nextDirection = "desc";
      else if (sorting.direction === "desc") nextDirection = null;
    }

    sorting.onSortChange(columnId, nextDirection);
  };

  const renderSortIcon = (columnId: string) => {
    if (!sorting || sorting.columnId !== columnId) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }

    if (sorting.direction === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }

    if (sorting.direction === "desc") {
      return <ArrowDown className="ml-2 h-4 w-4" />;
    }

    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-hidden rounded-lg border border-border/80 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className={column.className}>
                  {column.sortable && sorting ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort(column.id)}
                    >
                      {column.header}
                      {renderSortIcon(column.id)}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pagination?.pageSize ?? 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={getRowId?.(row) ?? String(index)}>
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {getCellValue(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}
    </div>
  );
}

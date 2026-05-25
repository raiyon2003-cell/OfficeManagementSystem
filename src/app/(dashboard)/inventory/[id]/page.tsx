"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { getInventoryItem } from "@/lib/api/inventory";
import type { StockMovement } from "@/types/entities";

export default function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: item, isLoading } = useQuery({
    queryKey: ["inventory", id],
    queryFn: () => getInventoryItem(id),
  });

  const movementColumns: DataTableColumn<StockMovement>[] = [
    {
      id: "type",
      header: "Type",
      cell: (row) => (
        <Badge variant={row.type === "IN" ? "success" : "warning"}>
          {row.type}
        </Badge>
      ),
    },
    { id: "quantity", header: "Qty", accessorKey: "quantity" },
    { id: "reason", header: "Reason", cell: (row) => row.reason ?? "—" },
    {
      id: "createdAt",
      header: "Date",
      cell: (row) => format(new Date(row.createdAt), "MMM d, yyyy h:mm a"),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full max-w-2xl" />
      </div>
    );
  }

  if (!item) {
    return <p className="text-muted-foreground">Item not found</p>;
  }

  const isLow = item.currentStock <= item.reorderLevel;

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={item.name}
        description={item.sku}
        actions={
          <Button variant="outline" asChild>
            <Link href="/inventory">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Stock Info</CardTitle>
          {isLow && <Badge variant="warning">Low Stock</Badge>}
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Current Stock</p>
            <p className="text-2xl font-bold">
              {item.currentStock} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Reorder Level</p>
            <p className="font-medium">{item.reorderLevel}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Category</p>
            <p className="font-medium">{item.category?.name ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Stock Movements</h2>
        <DataTable
          columns={movementColumns}
          data={item.movements ?? []}
          getRowId={(row) => row.id}
          emptyTitle="No movements recorded"
        />
      </div>
    </PageTransition>
  );
}

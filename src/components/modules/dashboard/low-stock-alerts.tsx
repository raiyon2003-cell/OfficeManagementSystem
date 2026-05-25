"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

interface LowStockItem {
  id: string;
  name: string;
  sku?: string;
  currentStock: number;
  minStockLevel?: number;
  reorderLevel?: number;
}

interface LowStockAlertsProps {
  items?: LowStockItem[];
  isLoading?: boolean;
}

export function LowStockAlerts({ items = [], isLoading }: LowStockAlertsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Low Stock Alerts
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inventory">View inventory</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            title="All stocked up"
            description="No items are below reorder level."
            className="py-6"
          />
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  {item.sku && (
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                  )}
                </div>
                <Badge variant="warning">
                  {item.currentStock} left
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import {
  StockMovementForm,
  type StockMovementFormValues,
} from "@/components/modules/inventory/stock-movement-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getInventoryItems,
  createStockMovement,
} from "@/lib/api/inventory";

export default function StockMovementPage() {
  const router = useRouter();

  const { data: items, isLoading } = useQuery({
    queryKey: ["inventory", "all"],
    queryFn: () => getInventoryItems({ limit: 100 }),
  });

  const mutation = useMutation({
    mutationFn: createStockMovement,
    onSuccess: () => {
      toast.success("Stock movement recorded");
      router.push("/inventory");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to record movement"),
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Record Stock Movement"
        description="Log stock in, out, or adjustments"
      />
      <Card className="max-w-xl">
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <StockMovementForm
              items={items?.data ?? []}
              onSubmit={async (data: StockMovementFormValues) => {
                await mutation.mutateAsync(data);
              }}
              isSubmitting={mutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}

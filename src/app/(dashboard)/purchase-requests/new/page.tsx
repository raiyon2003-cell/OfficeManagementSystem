"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { RequestForm } from "@/components/modules/purchase-requests/request-form";
import { Card, CardContent } from "@/components/ui/card";
import { createPurchaseRequest } from "@/lib/api/purchase-requests";
import { getVendors } from "@/lib/api/vendors";
import type { PurchaseRequestInput } from "@/lib/api/purchase-requests";

export default function NewPurchaseRequestPage() {
  const router = useRouter();

  const { data: vendors } = useQuery({
    queryKey: ["vendors", "all"],
    queryFn: () => getVendors({ limit: 100 }),
  });

  const mutation = useMutation({
    mutationFn: createPurchaseRequest,
    onSuccess: (data) => {
      toast.success("Purchase request created");
      router.push(`/purchase-requests/${data.id}`);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Creation failed"),
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="New Purchase Request"
        description="Create a new procurement request"
      />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <RequestForm
            vendors={vendors?.data ?? []}
            onSubmit={async (data: PurchaseRequestInput) => {
              await mutation.mutateAsync(data);
            }}
            isSubmitting={mutation.isPending}
          />
        </CardContent>
      </Card>
    </PageTransition>
  );
}

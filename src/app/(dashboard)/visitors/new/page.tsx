"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { VisitorForm } from "@/components/modules/visitors/visitor-form";
import { Card, CardContent } from "@/components/ui/card";
import { createVisitor } from "@/lib/api/visitors";
import type { VisitorInput } from "@/lib/api/visitors";

export default function NewVisitorPage() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: createVisitor,
    onSuccess: () => {
      toast.success("Visitor registered successfully");
      router.push("/visitors");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Registration failed"),
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Register Visitor"
        description="Pre-register a visitor for an upcoming visit"
      />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <VisitorForm
            onSubmit={(data: VisitorInput) => {
              mutation.mutate(data);
            }}
            isSubmitting={mutation.isPending}
          />
        </CardContent>
      </Card>
    </PageTransition>
  );
}

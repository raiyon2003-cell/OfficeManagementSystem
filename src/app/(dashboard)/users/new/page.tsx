"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { UserForm } from "@/components/modules/users/user-form";
import { Card, CardContent } from "@/components/ui/card";
import { createUser } from "@/lib/api/users";
import type { CreateUserInput } from "@/lib/validations/auth";

export default function NewUserPage() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("User created successfully");
      router.push("/users");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Creation failed"),
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Create User"
        description="Add a new user to the office management system"
      />
      <Card className="max-w-md">
        <CardContent className="pt-6">
          <UserForm
            onSubmit={async (data: CreateUserInput) => {
              await mutation.mutateAsync(data);
            }}
            isSubmitting={mutation.isPending}
          />
        </CardContent>
      </Card>
    </PageTransition>
  );
}

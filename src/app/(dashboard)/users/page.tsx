"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { SearchInput } from "@/components/shared/search-input";
import { UserTable } from "@/components/modules/users/user-table";
import { Button } from "@/components/ui/button";
import { getUsers } from "@/lib/api/users";
import { PAGINATION_DEFAULTS } from "@/lib/constants";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search],
    queryFn: () =>
      getUsers({
        page,
        limit: PAGINATION_DEFAULTS.limit,
        search: search || undefined,
      }),
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Manage system users and role assignments"
        actions={
          <Button asChild>
            <Link href="/users/new">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search users..."
        className="sm:max-w-xs"
      />

      <UserTable
        users={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        pageSize={PAGINATION_DEFAULTS.limit}
        totalItems={data?.meta.total ?? 0}
        onPageChange={setPage}
      />
    </PageTransition>
  );
}

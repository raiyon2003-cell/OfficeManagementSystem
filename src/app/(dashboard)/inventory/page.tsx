"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { SearchInput } from "@/components/shared/search-input";
import { InventoryTable } from "@/components/modules/inventory/inventory-table";
import { CategoryFilter } from "@/components/modules/inventory/category-filter";
import { Button } from "@/components/ui/button";
import {
  getInventoryItems,
  getInventoryCategories,
} from "@/lib/api/inventory";
import { PAGINATION_DEFAULTS } from "@/lib/constants";

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const { data: categories } = useQuery({
    queryKey: ["inventory", "categories"],
    queryFn: getInventoryCategories,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", page, search, categoryId],
    queryFn: () =>
      getInventoryItems({
        page,
        limit: PAGINATION_DEFAULTS.limit,
        search: search || undefined,
        categoryId,
      }),
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track stock levels and manage inventory items"
        actions={
          <Button variant="outline" asChild>
            <Link href="/inventory/movements">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Record Movement
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search inventory..."
          className="sm:max-w-xs"
        />
        <CategoryFilter
          categories={categories ?? []}
          value={categoryId}
          onChange={(v) => {
            setCategoryId(v);
            setPage(1);
          }}
        />
      </div>

      <InventoryTable
        items={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        pageSize={PAGINATION_DEFAULTS.limit}
        totalItems={data?.meta.total ?? 0}
        onPageChange={setPage}
      />
    </PageTransition>
  );
}

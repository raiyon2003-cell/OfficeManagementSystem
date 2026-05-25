"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { ApprovalActions } from "@/components/modules/purchase-requests/approval-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPurchaseRequest } from "@/lib/api/purchase-requests";

export default function PurchaseRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: request, isLoading } = useQuery({
    queryKey: ["purchase-requests", id],
    queryFn: () => getPurchaseRequest(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!request) {
    return <p className="text-muted-foreground">Request not found</p>;
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={request.title}
        description={`Created ${format(new Date(request.createdAt), "MMMM d, yyyy")}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={request.status} />
            <Button variant="outline" asChild>
              <Link href="/purchase-requests">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {request.description && (
            <p className="text-sm text-muted-foreground">{request.description}</p>
          )}
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Requested By</p>
              <p className="font-medium">
                {request.requestedBy
                  ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Vendor</p>
              <p className="font-medium">{request.vendor?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Amount</p>
              <p className="text-lg font-bold">
                ${Number(request.totalAmount).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${Number(item.unitPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${Number(item.totalPrice).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ApprovalActions
        requestId={request.id}
        status={request.status}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["purchase-requests", id] })
        }
      />
    </PageTransition>
  );
}

"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { VisitorTimeline } from "@/components/modules/visitors/visitor-timeline";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getVisitor } from "@/lib/api/visitors";

export default function VisitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: visitor, isLoading } = useQuery({
    queryKey: ["visitors", id],
    queryFn: () => getVisitor(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full max-w-2xl" />
        <Skeleton className="h-64 w-full max-w-xl" />
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Visitor not found</p>
        <Button variant="link" asChild>
          <Link href="/visitors">Back to visitors</Link>
        </Button>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={visitor.fullName}
        description={`Visit on ${format(new Date(visitor.scheduledDate), "MMMM d, yyyy")}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/visitors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Visitor Details</CardTitle>
            <StatusBadge status={visitor.status} />
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{visitor.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{visitor.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Company</p>
              <p className="font-medium">{visitor.company ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Purpose</p>
              <p className="font-medium">{visitor.purpose}</p>
            </div>
            {visitor.checkInAt && (
              <div>
                <p className="text-muted-foreground">Checked In</p>
                <p className="font-medium">
                  {format(new Date(visitor.checkInAt), "MMM d, h:mm a")}
                </p>
              </div>
            )}
            {visitor.checkOutAt && (
              <div>
                <p className="text-muted-foreground">Checked Out</p>
                <p className="font-medium">
                  {format(new Date(visitor.checkOutAt), "MMM d, h:mm a")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <VisitorTimeline logs={visitor.logs} />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

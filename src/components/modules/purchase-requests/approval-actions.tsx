"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  approvePurchaseRequest,
  rejectPurchaseRequest,
} from "@/lib/api/purchase-requests";

interface ApprovalActionsProps {
  requestId: string;
  status: string;
  onSuccess?: () => void;
}

export function ApprovalActions({
  requestId,
  status,
  onSuccess,
}: ApprovalActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (status !== "PENDING" && status !== "DRAFT") {
    return null;
  }

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await approvePurchaseRequest(requestId);
      toast.success("Purchase request approved");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setIsLoading(true);
    try {
      await rejectPurchaseRequest(requestId, reason);
      toast.success("Purchase request rejected");
      setRejectOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleApprove} disabled={isLoading}>
          <Check className="mr-2 h-4 w-4" />
          Approve
        </Button>
        <Button
          variant="destructive"
          onClick={() => setRejectOpen(true)}
          disabled={isLoading}
        >
          <X className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject purchase request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Rejection reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

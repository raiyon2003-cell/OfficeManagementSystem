"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES } from "@/lib/constants";
import { assignRole } from "@/lib/api/users";

interface RoleAssignmentProps {
  userId: string;
  currentRole: string;
  onSuccess?: () => void;
}

export function RoleAssignment({
  userId,
  currentRole,
  onSuccess,
}: RoleAssignmentProps) {
  const [role, setRole] = useState(currentRole);
  const [isLoading, setIsLoading] = useState(false);

  const handleAssign = async () => {
    setIsLoading(true);
    try {
      await assignRole(userId, role);
      toast.success("Role updated successfully");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium">Assign Role</p>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(ROLES).map((r) => (
              <SelectItem key={r} value={r}>
                {r.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleAssign} disabled={isLoading || role === currentRole}>
        {isLoading ? "Saving..." : "Update Role"}
      </Button>
    </div>
  );
}

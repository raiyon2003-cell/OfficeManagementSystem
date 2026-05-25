"use client";

import * as React from "react";
import { Calendar } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  fromLabel?: string;
  toLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  fromLabel = "From",
  toLabel = "To",
  className,
  disabled = false,
}: DateRangePickerProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end", className)}>
      <div className="grid w-full gap-2 sm:max-w-[200px]">
        <Label htmlFor="date-from">{fromLabel}</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="date-from"
            type="date"
            value={value.from}
            max={value.to || undefined}
            disabled={disabled}
            className="pl-9"
            onChange={(event) =>
              onChange({ ...value, from: event.target.value })
            }
          />
        </div>
      </div>
      <div className="grid w-full gap-2 sm:max-w-[200px]">
        <Label htmlFor="date-to">{toLabel}</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="date-to"
            type="date"
            value={value.to}
            min={value.from || undefined}
            disabled={disabled}
            className="pl-9"
            onChange={(event) => onChange({ ...value, to: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

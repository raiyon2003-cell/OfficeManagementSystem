"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportFilters } from "@/lib/api/reports";

const filterSchema = z.object({
  type: z.string().min(1, "Report type is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterSchema>;

const reportTypes = [
  { value: "VISITOR", label: "Visitors" },
  { value: "BOOKING", label: "Bookings" },
  { value: "INVENTORY", label: "Inventory" },
  { value: "STATIONERY", label: "Stationery" },
  { value: "PURCHASE", label: "Purchase Requests" },
  { value: "EXPENSE", label: "Expenses" },
  { value: "VENDOR", label: "Vendors" },
  { value: "AUDIT", label: "Audit Log" },
];

interface ReportFiltersFormProps {
  onSubmit: (filters: ReportFilters) => void;
  isLoading?: boolean;
}

export function ReportFiltersForm({
  onSubmit,
  isLoading,
}: ReportFiltersFormProps) {
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      type: "VISITOR",
      startDate: "",
      endDate: "",
      status: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {reportTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-end">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StationeryItem } from "@/types/entities";

const issuanceSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  employeeId: z.string().min(1, "Employee ID is required"),
  quantity: z.coerce.number<number>().int().positive(),
  purpose: z.string().optional(),
});

export type IssuanceFormValues = z.infer<typeof issuanceSchema>;

interface IssuanceFormProps {
  items: StationeryItem[];
  onSubmit: (data: IssuanceFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function IssuanceForm({ items, onSubmit, isSubmitting }: IssuanceFormProps) {
  const form = useForm<IssuanceFormValues>({
    resolver: zodResolver(issuanceSchema),
    defaultValues: { itemId: "", employeeId: "", quantity: 1, purpose: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="itemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stationery" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {items.length > 0 ? (
                    items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} — {item.currentStock} available
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No stationery items available
                    </div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee ID</FormLabel>
              <FormControl>
                <Input placeholder="Employee user ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Issuing..." : "Issue Stationery"}
        </Button>
      </form>
    </Form>
  );
}

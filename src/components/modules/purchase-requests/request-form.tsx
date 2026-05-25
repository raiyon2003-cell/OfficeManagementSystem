"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";

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
import type { Vendor } from "@/types/entities";
import type { PurchaseRequestInput } from "@/lib/api/purchase-requests";

const itemSchema = z.object({
  description: z.string().trim().min(1, "Description required"),
  quantity: z.coerce.number<number>().int().positive(),
  unitPrice: z.coerce.number<number>().positive(),
});

const requestSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  vendorId: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface RequestFormProps {
  vendors?: Vendor[];
  onSubmit: (data: PurchaseRequestInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function RequestForm({ vendors = [], onSubmit, isSubmitting }: RequestFormProps) {
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      description: "",
      vendorId: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Title</FormLabel>
              <FormControl>
                <Input placeholder="Office supplies Q2" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {vendors.length > 0 && (
          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor (optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Line Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add item
            </Button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-lg border p-4 sm:grid-cols-4"
            >
              <FormField
                control={form.control}
                name={`items.${index}.description`}
                render={({ field: f }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Qty</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end gap-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Unit Price</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Purchase Request"}
        </Button>
      </form>
    </Form>
  );
}

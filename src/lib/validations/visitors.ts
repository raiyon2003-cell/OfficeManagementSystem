import { z } from "zod";
import { VisitorStatus } from "@/generated/prisma/client";
import { paginationSchema } from "@/lib/validations/common";

export const createVisitorSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(200),
  email: z.email("Invalid email").optional().nullable(),
  phone: z.string().trim().min(1, "Phone is required"),
  company: z.string().trim().optional().nullable(),
  purpose: z.string().trim().min(1, "Purpose is required"),
  idType: z.string().trim().optional().nullable(),
  idNumber: z.string().trim().optional().nullable(),
  vehicleNumber: z.string().trim().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  scheduledDate: z.coerce.date({ error: "Invalid scheduled date" }),
  scheduledTime: z.string().trim().optional().nullable(),
  hostId: z.string().min(1, "Host is required").optional(),
  notes: z.string().trim().optional().nullable(),
  isWalkIn: z.boolean().optional().default(false),
});

export const updateVisitorSchema = createVisitorSchema
  .partial()
  .omit({ isWalkIn: true });

export const listVisitorsSchema = paginationSchema.extend({
  status: z.nativeEnum(VisitorStatus).optional(),
  hostId: z.string().optional(),
  scheduledDate: z.coerce.date().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const approveVisitorSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().trim().optional().nullable(),
});

export const checkInVisitorSchema = z.object({
  badgeNumber: z.string().trim().optional().nullable(),
});

export type CreateVisitorInput = z.infer<typeof createVisitorSchema>;
export type UpdateVisitorInput = z.infer<typeof updateVisitorSchema>;
export type ListVisitorsInput = z.infer<typeof listVisitorsSchema>;
export type ApproveVisitorInput = z.infer<typeof approveVisitorSchema>;

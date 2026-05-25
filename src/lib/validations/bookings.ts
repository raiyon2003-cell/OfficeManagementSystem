import { z } from "zod";
import {
  BookingStatus,
  MeetingRoomStatus,
  RecurringFrequency,
} from "@/generated/prisma/client";
import { paginationSchema } from "@/lib/validations/common";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM format");

export const createMeetingRoomSchema = z.object({
  name: z.string().trim().min(1).max(100),
  capacity: z.coerce.number().int().min(1),
  status: z.nativeEnum(MeetingRoomStatus).optional(),
  location: z.string().trim().min(1),
  floor: z.string().trim().optional().nullable(),
  building: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  equipment: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).default(1),
      }),
    )
    .optional(),
});

export const updateMeetingRoomSchema = createMeetingRoomSchema.partial();

export const listMeetingRoomsSchema = paginationSchema.extend({
  status: z.nativeEnum(MeetingRoomStatus).optional(),
  location: z.string().optional(),
});

export const availabilityQuerySchema = z.object({
  date: z.coerce.date({ error: "Invalid date" }),
  startTime: timeSchema,
  endTime: timeSchema,
});

export const utilizationQuerySchema = z.object({
  startDate: z.coerce.date({ error: "Invalid start date" }),
  endDate: z.coerce.date({ error: "Invalid end date" }),
});

export const createBookingSchema = z.object({
  title: z.string().trim().min(1).max(200),
  roomId: z.string().min(1),
  date: z.coerce.date({ error: "Invalid date" }),
  startTime: timeSchema,
  endTime: timeSchema,
  attendees: z.coerce.number().int().min(1).default(1),
  attendeeEmails: z.array(z.email()).optional().default([]),
  remarks: z.string().trim().optional().nullable(),
  equipmentIds: z
    .array(
      z.object({
        equipmentId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).default(1),
      }),
    )
    .optional(),
});

export const updateBookingSchema = createBookingSchema.partial();

export const listBookingsSchema = paginationSchema.extend({
  date: z.coerce.date().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  roomId: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  organizerId: z.string().optional(),
});

export const approveBookingSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().trim().optional().nullable(),
});

export const createRecurringBookingSchema = createBookingSchema.extend({
  frequency: z.nativeEnum(RecurringFrequency),
  interval: z.coerce.number().int().min(1).default(1),
  daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)).optional(),
  endDate: z.coerce.date().optional().nullable(),
  occurrences: z.coerce.number().int().min(1).optional().nullable(),
});

export type CreateMeetingRoomInput = z.infer<typeof createMeetingRoomSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ListBookingsInput = z.infer<typeof listBookingsSchema>;

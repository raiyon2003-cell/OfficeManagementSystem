import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginatedResponse } from "@/lib/api-response";
import type { ListParams, RoomBooking } from "@/types/entities";
import { buildQueryParams, unwrapPaginated } from "@/lib/api/client-helpers";

export type BookingInput = {
  title: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees?: number;
  attendeeEmails?: string[];
  remarks?: string;
};

export async function getBookings(params?: ListParams) {
  const response = await apiClient.get<PaginatedResponse<RoomBooking>>(
    "/bookings",
    { params: buildQueryParams(params) },
  );
  return unwrapPaginated(response);
}

export async function getBooking(id: string) {
  const response = await apiClient.get<ApiSuccessResponse<RoomBooking>>(
    `/bookings/${id}`,
  );
  return unwrapData(response);
}

export async function createBooking(input: BookingInput) {
  const response = await apiClient.post<ApiSuccessResponse<RoomBooking>>(
    "/bookings",
    input,
  );
  return unwrapData(response);
}

export async function updateBooking(id: string, input: Partial<BookingInput>) {
  const response = await apiClient.patch<ApiSuccessResponse<RoomBooking>>(
    `/bookings/${id}`,
    input,
  );
  return unwrapData(response);
}

export async function cancelBooking(id: string) {
  const response = await apiClient.post<ApiSuccessResponse<RoomBooking>>(
    `/bookings/${id}/cancel`,
  );
  return unwrapData(response);
}

export async function checkAvailability(params: {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const response = await apiClient.get<
    ApiSuccessResponse<{ available: boolean; conflicts?: RoomBooking[] }>
  >(`/meeting-rooms/${params.roomId}/availability`, {
    params: {
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
    },
  });
  return unwrapData(response);
}

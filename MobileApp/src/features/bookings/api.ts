import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { bookingEffects, qk } from '@/api/queryKeys';
import { useAppMutation } from '@/api/useAppMutation';
import type { Booking, BookingDetail, BookingQuote, BookingStatus, LocalDateTime, Page } from '@/domain/types';

export type BookingFilters = {
  from?: string;
  to?: string;
  courtId?: string;
  customerId?: string;
  status?: BookingStatus[];
  q?: string;
  order?: 'asc' | 'desc';
};

export type SlotInput = { courtId: string; startAt: LocalDateTime; endAt: LocalDateTime };
export type CreateBookingInput = SlotInput & { customerId: string; discountId?: string; notes?: string };

const enc = encodeURIComponent;

export const bookingsService = {
  list: (f: BookingFilters, cursor?: string | null) =>
    apiRequest<Page<Booking>>('/api/bookings', { query: { ...f, status: f.status?.join(','), cursor: cursor ?? undefined, limit: 20 } }),
  get: (id: string) => apiRequest<BookingDetail>(`/api/bookings/${enc(id)}`),
  quote: (input: SlotInput & { discountId?: string }) => apiRequest<BookingQuote>('/api/bookings/quote', { method: 'POST', body: input }),
  create: (input: CreateBookingInput) => apiRequest<BookingDetail>('/api/bookings', { method: 'POST', body: input }),
  update: (id: string, input: { customerId?: string; notes?: string }) => apiRequest<BookingDetail>(`/api/bookings/${enc(id)}`, { method: 'PATCH', body: input }),
  reschedule: (id: string, input: SlotInput) => apiRequest<BookingDetail>(`/api/bookings/${enc(id)}/reschedule`, { method: 'POST', body: input }),
  cancel: (id: string, input: { reason: string; refund: boolean }) => apiRequest<BookingDetail>(`/api/bookings/${enc(id)}/cancel`, { method: 'POST', body: input }),
  setStatus: (id: string, status: 'COMPLETED' | 'NO_SHOW' | 'CONFIRMED') => apiRequest<BookingDetail>(`/api/bookings/${enc(id)}/status`, { method: 'POST', body: { status } }),
  remind: (id: string) => apiRequest<void>(`/api/bookings/${enc(id)}/payment-reminders`, { method: 'POST' }),
};

export function useBookings(filters: BookingFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: [...qk.bookings, 'list', filters],
    queryFn: ({ pageParam }) => bookingsService.list(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled,
  });
}

export function useBooking(id: string) {
  return useQuery({ queryKey: [...qk.bookings, 'detail', id], queryFn: () => bookingsService.get(id), staleTime: 15_000 });
}

/** Server-computed price for a slot. Disabled until a slot is chosen. */
export function useBookingQuote(input: (SlotInput & { discountId?: string }) | null) {
  return useQuery({
    queryKey: [...qk.quote, input],
    queryFn: () => bookingsService.quote(input!),
    enabled: !!input,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateBooking() {
  return useAppMutation({ mutationFn: bookingsService.create, invalidate: bookingEffects, successMessage: 'Booking created', errorTitle: "Couldn't create booking" });
}

export function useUpdateBooking(id: string) {
  return useAppMutation({
    mutationFn: (input: { customerId?: string; notes?: string }) => bookingsService.update(id, input),
    invalidate: bookingEffects,
    successMessage: 'Booking updated',
    errorTitle: "Couldn't update booking",
  });
}

export function useRescheduleBooking(id: string) {
  return useAppMutation({
    mutationFn: (input: SlotInput) => bookingsService.reschedule(id, input),
    invalidate: bookingEffects,
    successMessage: 'Booking rescheduled',
    errorTitle: "Couldn't reschedule",
  });
}

export function useCancelBooking(id: string) {
  return useAppMutation({
    mutationFn: (input: { reason: string; refund: boolean }) => bookingsService.cancel(id, input),
    invalidate: bookingEffects,
    successMessage: 'Booking cancelled',
    errorTitle: "Couldn't cancel booking",
    toastValidationErrors: true,
  });
}

export function useSetBookingStatus(id: string) {
  return useAppMutation({
    mutationFn: (status: 'COMPLETED' | 'NO_SHOW' | 'CONFIRMED') => bookingsService.setStatus(id, status),
    invalidate: bookingEffects,
    successMessage: (_d, s) => (s === 'NO_SHOW' ? 'Marked as no-show' : s === 'COMPLETED' ? 'Marked as completed' : 'Booking confirmed'),
    errorTitle: "Couldn't update status",
  });
}

export function useSendReminder() {
  return useAppMutation({ mutationFn: bookingsService.remind, invalidate: [qk.bookings], successMessage: 'Reminder sent', errorTitle: "Couldn't send reminder" });
}

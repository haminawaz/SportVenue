import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { bookingEffects, qk } from '@/api/queryKeys';
import { useAppMutation } from '@/api/useAppMutation';
import type { OutstandingBalance, Page, Payment, PaymentMethod } from '@/domain/types';

export type OutstandingSort = 'amount' | 'oldest';
export type RecordPaymentInput = { bookingId: string; amount: number; method: PaymentMethod; note?: string };

const enc = encodeURIComponent;

export const paymentsService = {
  list: (p: { customerId?: string; bookingId?: string }, cursor?: string | null) =>
    apiRequest<Page<Payment>>('/api/payments', { query: { ...p, cursor: cursor ?? undefined, limit: 20 } }),
  outstanding: (p: { sort?: OutstandingSort; customerId?: string }, cursor?: string | null) =>
    apiRequest<Page<OutstandingBalance> & { totalAmount: number }>('/api/payments/outstanding', { query: { ...p, cursor: cursor ?? undefined, limit: 20 } }),
  get: (id: string) => apiRequest<Payment>(`/api/payments/${enc(id)}`),
  record: (input: RecordPaymentInput) => apiRequest<Payment>('/api/payments', { method: 'POST', body: input }),
};

export function usePayments(params: { customerId?: string; bookingId?: string }) {
  return useInfiniteQuery({
    queryKey: [...qk.payments, 'list', params],
    queryFn: ({ pageParam }) => paymentsService.list(params, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 30_000,
  });
}

export function useOutstanding(params: { sort?: OutstandingSort; customerId?: string }) {
  return useInfiniteQuery({
    queryKey: [...qk.payments, 'outstanding', params],
    queryFn: ({ pageParam }) => paymentsService.outstanding(params, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 30_000,
  });
}

export function usePayment(id: string) {
  return useQuery({ queryKey: [...qk.payments, 'detail', id], queryFn: () => paymentsService.get(id) });
}

export function useRecordPayment() {
  return useAppMutation({
    mutationFn: paymentsService.record,
    invalidate: bookingEffects,
    successMessage: 'Payment recorded',
    errorTitle: "Couldn't record payment",
  });
}

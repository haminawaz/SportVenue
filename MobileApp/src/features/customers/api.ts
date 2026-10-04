import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { qk } from '@/api/queryKeys';
import { useAppMutation } from '@/api/useAppMutation';
import type { Customer, CustomerDetail, CustomerInput, Page } from '@/domain/types';

export type CustomerFilter = 'active' | 'regular' | 'balance' | 'inactive' | 'all';
export type CustomerSort = 'name' | 'recent' | 'balance' | 'spent';

const enc = encodeURIComponent;

export const customersService = {
  list: (p: { q?: string; filter?: CustomerFilter; sort?: CustomerSort }, cursor?: string | null) =>
    apiRequest<Page<Customer>>('/api/customers', { query: { ...p, cursor: cursor ?? undefined, limit: 25 } }),
  get: (id: string) => apiRequest<CustomerDetail>(`/api/customers/${enc(id)}`),
  create: (input: CustomerInput & { note?: string }) => apiRequest<CustomerDetail>('/api/customers', { method: 'POST', body: input }),
  update: (id: string, input: CustomerInput) => apiRequest<CustomerDetail>(`/api/customers/${enc(id)}`, { method: 'PATCH', body: input }),
  setStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') => apiRequest<CustomerDetail>(`/api/customers/${enc(id)}`, { method: 'PATCH', body: { status } }),
  remove: (id: string) => apiRequest<void>(`/api/customers/${enc(id)}`, { method: 'DELETE' }),
  addNote: (id: string, body: string) => apiRequest<CustomerDetail>(`/api/customers/${enc(id)}/notes`, { method: 'POST', body: { body } }),
  deleteNote: (id: string, noteId: string) => apiRequest<CustomerDetail>(`/api/customers/${enc(id)}/notes/${enc(noteId)}`, { method: 'DELETE' }),
};

const customerEffects = [qk.customers, qk.bookings, qk.dashboard];

export function useCustomers(params: { q?: string; filter?: CustomerFilter; sort?: CustomerSort }) {
  return useInfiniteQuery({
    queryKey: [...qk.customers, 'list', params],
    queryFn: ({ pageParam }) => customersService.list(params, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCustomer(id: string, enabled = !!id) {
  return useQuery({ queryKey: [...qk.customers, 'detail', id], queryFn: () => customersService.get(id), staleTime: 15_000, enabled });
}

export function useCreateCustomer() {
  return useAppMutation({ mutationFn: customersService.create, invalidate: customerEffects, successMessage: 'Customer added', errorTitle: "Couldn't add customer" });
}

export function useUpdateCustomer(id: string) {
  return useAppMutation({
    mutationFn: (input: CustomerInput) => customersService.update(id, input),
    invalidate: customerEffects,
    successMessage: 'Customer saved',
    errorTitle: "Couldn't save customer",
  });
}

export function useSetCustomerStatus(id: string) {
  return useAppMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE') => customersService.setStatus(id, status),
    invalidate: customerEffects,
    successMessage: (_d, s) => (s === 'ACTIVE' ? 'Customer reactivated' : 'Customer deactivated'),
    errorTitle: "Couldn't update customer",
  });
}

export function useDeleteCustomer() {
  return useAppMutation({ mutationFn: customersService.remove, invalidate: customerEffects, successMessage: 'Customer deleted', errorTitle: "Couldn't delete customer" });
}

export function useAddNote(id: string) {
  return useAppMutation({ mutationFn: (body: string) => customersService.addNote(id, body), invalidate: [qk.customers], successMessage: 'Note added', errorTitle: "Couldn't add note" });
}

export function useDeleteNote(id: string) {
  return useAppMutation({ mutationFn: (noteId: string) => customersService.deleteNote(id, noteId), invalidate: [qk.customers], successMessage: 'Note deleted', errorTitle: "Couldn't delete note" });
}

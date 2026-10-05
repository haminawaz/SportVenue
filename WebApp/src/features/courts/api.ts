import { useQueries, useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { qk } from '@/api/queryKeys';
import { useAppMutation } from '@/api/useAppMutation';
import type { Court, CourtAvailability, CourtStatus, CourtSummary } from '@/domain/types';

export type CourtInput = Pick<Court, 'name' | 'sport' | 'surface' | 'indoor' | 'status' | 'hourlyRate' | 'slotMinutes' | 'notes'>;

const enc = encodeURIComponent;

export const courtsService = {
  list: (status?: CourtStatus[]) => apiRequest<CourtSummary[]>('/api/courts', { query: { status: status?.join(',') } }),
  get: (id: string) => apiRequest<CourtSummary>(`/api/courts/${enc(id)}`),
  create: (input: CourtInput) => apiRequest<CourtSummary>('/api/courts', { method: 'POST', body: input }),
  update: (id: string, input: Partial<CourtInput>) => apiRequest<CourtSummary>(`/api/courts/${enc(id)}`, { method: 'PATCH', body: input }),
  remove: (id: string) => apiRequest<void>(`/api/courts/${enc(id)}`, { method: 'DELETE' }),
  availability: (id: string, date: string) => apiRequest<CourtAvailability>(`/api/courts/${enc(id)}/availability`, { query: { date } }),
};

const courtEffects = [qk.courts, qk.availability, qk.dashboard, qk.analytics, qk.pricing, qk.notifications];

export function useCourts(status?: CourtStatus[]) {
  return useQuery({ queryKey: [...qk.courts, 'list', status ?? 'all'], queryFn: () => courtsService.list(status), staleTime: 60_000 });
}

export function useCourt(id: string, enabled = !!id) {
  return useQuery({ queryKey: [...qk.courts, 'detail', id], queryFn: () => courtsService.get(id), staleTime: 30_000, enabled });
}

export function useAvailability(courtId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: [...qk.availability, courtId, date],
    queryFn: () => courtsService.availability(courtId!, date!),
    enabled: !!courtId && !!date,
    staleTime: 20_000,
  });
}

/** Availability for several courts on one day (the multi-court schedule). Same cache entries as useAvailability. */
export function useAvailabilities(courtIds: string[], date: string) {
  return useQueries({
    queries: courtIds.map((courtId) => ({
      queryKey: [...qk.availability, courtId, date],
      queryFn: () => courtsService.availability(courtId, date),
      staleTime: 20_000,
    })),
  });
}

export function useCreateCourt() {
  return useAppMutation({ mutationFn: courtsService.create, invalidate: courtEffects, successMessage: 'Court added', errorTitle: "Couldn't add court" });
}

export function useUpdateCourt(id: string, successMessage = 'Court saved') {
  return useAppMutation({
    mutationFn: (input: Partial<CourtInput>) => courtsService.update(id, input),
    invalidate: courtEffects,
    successMessage,
    errorTitle: "Couldn't save court",
  });
}

export function useDeleteCourt() {
  return useAppMutation({ mutationFn: courtsService.remove, invalidate: courtEffects, successMessage: 'Court deleted', errorTitle: "Couldn't delete court" });
}

import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { qk } from '@/api/queryKeys';
import { useAppMutation } from '@/api/useAppMutation';
import type { Opportunity, OpportunityStatus } from '@/domain/types';

const enc = encodeURIComponent;

export const opportunitiesService = {
  list: (status?: OpportunityStatus[]) => apiRequest<Opportunity[]>('/api/opportunities', { query: { status: status?.join(',') } }),
  get: (id: string) => apiRequest<Opportunity>(`/api/opportunities/${enc(id)}`),
  transition: (id: string, action: 'start' | 'resolve' | 'dismiss' | 'reopen', note?: string) =>
    apiRequest<Opportunity>(`/api/opportunities/${enc(id)}/${action}`, { method: 'POST', body: { note } }),
};

export function useOpportunities(status?: OpportunityStatus[]) {
  return useQuery({ queryKey: [...qk.opportunities, 'list', status ?? 'all'], queryFn: () => opportunitiesService.list(status), staleTime: 60_000 });
}

export function useOpportunity(id: string) {
  return useQuery({ queryKey: [...qk.opportunities, 'detail', id], queryFn: () => opportunitiesService.get(id) });
}

const messages = { start: 'Marked as in progress', resolve: 'Opportunity resolved', dismiss: 'Opportunity dismissed', reopen: 'Opportunity reopened' } as const;

export function useOpportunityTransition(id: string) {
  return useAppMutation({
    mutationFn: ({ action, note }: { action: keyof typeof messages; note?: string }) => opportunitiesService.transition(id, action, note),
    invalidate: [qk.opportunities, qk.dashboard],
    successMessage: (_d, v) => messages[v.action],
    errorTitle: "Couldn't update opportunity",
  });
}

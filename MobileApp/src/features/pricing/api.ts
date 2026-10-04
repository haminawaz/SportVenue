import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { qk } from '@/api/queryKeys';
import { useAppMutation } from '@/api/useAppMutation';
import type { Discount, DiscountInput, Page, PricingHistoryEntry, PricingRule, PricingRuleInput } from '@/domain/types';

const enc = encodeURIComponent;

export const pricingService = {
  rules: (courtId?: string) => apiRequest<PricingRule[]>('/api/pricing/rules', { query: { courtId } }),
  rule: (id: string) => apiRequest<PricingRule>(`/api/pricing/rules/${enc(id)}`),
  createRule: (input: PricingRuleInput) => apiRequest<PricingRule>('/api/pricing/rules', { method: 'POST', body: input }),
  updateRule: (id: string, input: Partial<PricingRuleInput>) => apiRequest<PricingRule>(`/api/pricing/rules/${enc(id)}`, { method: 'PATCH', body: input }),
  deleteRule: (id: string) => apiRequest<void>(`/api/pricing/rules/${enc(id)}`, { method: 'DELETE' }),
  discounts: () => apiRequest<Discount[]>('/api/pricing/discounts'),
  discount: (id: string) => apiRequest<Discount>(`/api/pricing/discounts/${enc(id)}`),
  createDiscount: (input: DiscountInput) => apiRequest<Discount>('/api/pricing/discounts', { method: 'POST', body: input }),
  updateDiscount: (id: string, input: Partial<DiscountInput>) => apiRequest<Discount>(`/api/pricing/discounts/${enc(id)}`, { method: 'PATCH', body: input }),
  deleteDiscount: (id: string) => apiRequest<void>(`/api/pricing/discounts/${enc(id)}`, { method: 'DELETE' }),
  history: (cursor?: string | null) => apiRequest<Page<PricingHistoryEntry>>('/api/pricing/history', { query: { cursor: cursor ?? undefined } }),
};

const pricingEffects = [qk.pricing, qk.availability, qk.quote];

export function usePricingRules(courtId?: string) {
  return useQuery({ queryKey: [...qk.pricing, 'rules', courtId ?? 'all'], queryFn: () => pricingService.rules(courtId), staleTime: 60_000 });
}
export function usePricingRule(id: string, enabled = !!id) {
  return useQuery({ queryKey: [...qk.pricing, 'rule', id], queryFn: () => pricingService.rule(id), enabled });
}
export function useDiscounts() {
  return useQuery({ queryKey: [...qk.pricing, 'discounts'], queryFn: pricingService.discounts, staleTime: 60_000 });
}
export function useDiscount(id: string, enabled = !!id) {
  return useQuery({ queryKey: [...qk.pricing, 'discount', id], queryFn: () => pricingService.discount(id), enabled });
}
export function usePricingHistory() {
  return useInfiniteQuery({
    queryKey: [...qk.pricing, 'history'],
    queryFn: ({ pageParam }) => pricingService.history(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useSaveRule(id?: string) {
  return useAppMutation({
    mutationFn: (input: PricingRuleInput) => (id ? pricingService.updateRule(id, input) : pricingService.createRule(input)),
    invalidate: pricingEffects,
    successMessage: id ? 'Rate saved' : 'Rate added',
    errorTitle: "Couldn't save rate",
  });
}
export function useToggleRule(id: string) {
  return useAppMutation({
    mutationFn: (active: boolean) => pricingService.updateRule(id, { active }),
    invalidate: pricingEffects,
    successMessage: (_d, active) => (active ? 'Rate activated' : 'Rate deactivated'),
    errorTitle: "Couldn't update rate",
  });
}
export function useDeleteRule() {
  return useAppMutation({ mutationFn: pricingService.deleteRule, invalidate: pricingEffects, successMessage: 'Rate deleted', errorTitle: "Couldn't delete rate" });
}
export function useSaveDiscount(id?: string) {
  return useAppMutation({
    mutationFn: (input: DiscountInput) => (id ? pricingService.updateDiscount(id, input) : pricingService.createDiscount(input)),
    invalidate: pricingEffects,
    successMessage: id ? 'Discount saved' : 'Discount created',
    errorTitle: "Couldn't save discount",
  });
}
export function useToggleDiscount(id: string) {
  return useAppMutation({
    mutationFn: (active: boolean) => pricingService.updateDiscount(id, { active }),
    invalidate: pricingEffects,
    successMessage: (_d, active) => (active ? 'Discount activated' : 'Discount deactivated'),
    errorTitle: "Couldn't update discount",
  });
}
export function useDeleteDiscount() {
  return useAppMutation({ mutationFn: pricingService.deleteDiscount, invalidate: pricingEffects, successMessage: 'Discount deleted', errorTitle: "Couldn't delete discount" });
}

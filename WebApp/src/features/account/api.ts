import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { qk } from '@/api/queryKeys';
import { useAppMutation } from '@/api/useAppMutation';
import type { NotificationPreferences, Subscription } from '@/domain/types';
import type { MeResponse } from '@/session/types';


export type ProfileInput = { firstName: string; lastName: string; email: string; phone?: string };

export const accountService = {
  updateProfile: (input: ProfileInput) => apiRequest<MeResponse>('/api/me', { method: 'PATCH', body: input }),
  preferences: () => apiRequest<NotificationPreferences>('/api/me/notification-preferences'),
  savePreferences: (input: Partial<NotificationPreferences>) => apiRequest<NotificationPreferences>('/api/me/notification-preferences', { method: 'PUT', body: input }),
  subscription: () => apiRequest<Subscription>('/api/billing/subscription'),
};

export function usePreferences() {
  return useQuery({ queryKey: qk.preferences, queryFn: accountService.preferences });
}
export function useSavePreferences() {
  return useAppMutation({ mutationFn: accountService.savePreferences, invalidate: [qk.preferences], errorTitle: "Couldn't save preferences" });
}
export function useSubscription() {
  return useQuery({ queryKey: qk.billing, queryFn: accountService.subscription });
}

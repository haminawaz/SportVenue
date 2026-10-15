import { useMutation, useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';

/** Why the owner filled in the form: sign up, see a demo first, or get pricing. */
export type LeadIntent = 'start' | 'demo' | 'quote';

export type DemoRequest = {
  intent?: LeadIntent;
  name: string;
  facilityName: string;
  city: string;
  phone: string;
  email: string;
  courts: string;
  note?: string;
};

/** Public endpoint: no session needed. */
export function useRequestDemo() {
  return useMutation({
    mutationFn: (input: DemoRequest) => apiRequest<{ id: string }>('/api/leads', { method: 'POST', body: input }),
  });
}

/**
 * Forgot password. The answer is the same whether or not the email has an
 * account. Demo builds have no inbox, so the mock server also returns the
 * reset link's token for the app to offer directly.
 */
export type ForgotPasswordResponse = { demoResetToken?: string };

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => apiRequest<ForgotPasswordResponse>('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  });
}

/** Checks a reset link before showing the form. A 410 means invalid, expired or already used (see the error code). */
export function useResetLink(token: string) {
  return useQuery({
    queryKey: ['auth', 'reset-link', token],
    queryFn: () => apiRequest<{ email: string }>(`/api/auth/reset-password/${encodeURIComponent(token)}`),
    enabled: token.length > 0,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; password: string }) => apiRequest<void>('/api/auth/reset-password', { method: 'POST', body: input }),
  });
}

import { useMutation } from '@tanstack/react-query';

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

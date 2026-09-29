import { useMutation } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';

export type DemoRequest = {
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

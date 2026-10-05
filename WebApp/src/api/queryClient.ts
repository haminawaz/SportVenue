import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './client';

const MAX_RETRIES = 2;

export function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= MAX_RETRIES) return false;
  if (error instanceof ApiError) {
    // Client errors will not fix themselves, except rate limiting.
    return error.status === 429 || error.status >= 500;
  }
  return true;
}

/**
 * Returning to the tab counts as "focus" (TanStack Query listens to the
 * browser's visibilitychange event), so stale queries refetch after a
 * meaningful time away, as the mobile app does on AppState "active". Going
 * offline pauses queries via the browser's online/offline events.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: { retry: false },
    },
  });
}

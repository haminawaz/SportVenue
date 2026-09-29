import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform, type AppStateStatus } from 'react-native';

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

/**
 * React Native has no window focus event. Returning to the app counts as
 * "focus", so stale queries refetch after a meaningful time away.
 */
export function bindAppStateToQueryFocus() {
  if (Platform.OS === 'web') return () => {};
  const onChange = (status: AppStateStatus) => focusManager.setFocused(status === 'active');
  const sub = AppState.addEventListener('change', onChange);
  return () => sub.remove();
}

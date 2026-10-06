import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { qk } from '@/api/queryKeys';
import type { Analytics } from '@/domain/types';
import type { CalendarDate } from '@/lib/datetime';

/** The facility report for a period, compared with the period of the same length before it. */
export function useAnalytics(startDate: CalendarDate, endDate: CalendarDate) {
  return useQuery({
    queryKey: [...qk.analytics, startDate, endDate],
    queryFn: () => apiRequest<Analytics>('/api/analytics', { query: { startDate, endDate } }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

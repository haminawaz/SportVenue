import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { qk } from '@/api/queryKeys';
import type { Analytics } from '@/domain/types';
import type { CalendarDate } from '@/lib/datetime';

type Period = { startDate: CalendarDate; endDate: CalendarDate };

/**
 * The facility report for a period, with every change measured against
 * `compare` (for example the same days last week; by default the period of the
 * same length before). `aheadUntil` also asks for the revenue already booked
 * for the days after the period up to that date.
 */
export function useAnalytics(startDate: CalendarDate, endDate: CalendarDate, aheadUntil?: CalendarDate, compare?: Period) {
  return useQuery({
    queryKey: [...qk.analytics, startDate, endDate, aheadUntil ?? null, compare?.startDate ?? null, compare?.endDate ?? null],
    queryFn: () =>
      apiRequest<Analytics>('/api/analytics', {
        query: { startDate, endDate, aheadUntil, compareStartDate: compare?.startDate, compareEndDate: compare?.endDate },
      }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

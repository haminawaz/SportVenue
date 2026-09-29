import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toUserFacingError } from '@/api/errors';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/ui/Toast';

import { facilityDashboardService } from '../services/facilityDashboardService';
import type { DateRange } from '../types/facilityDashboard.types';

/** Dashboard figures change as bookings come in; one minute keeps them fresh without hammering the API. */
export const DASHBOARD_STALE_TIME_MS = 60_000;

export const facilityDashboardKeys = {
  all: ['facility-dashboard'] as const,
  facility: (facilityId: string) => [...facilityDashboardKeys.all, facilityId] as const,
  range: (facilityId: string, startDate: string, endDate: string) =>
    [...facilityDashboardKeys.facility(facilityId), startDate, endDate] as const,
};

export function useFacilityDashboard(range: DateRange, enabled = true) {
  const { session } = useSession();
  const facilityId = session.facility.id;

  return useQuery({
    queryKey: facilityDashboardKeys.range(facilityId, range.startDate, range.endDate),
    queryFn: ({ signal }) =>
      facilityDashboardService.getDashboard({ facilityId, startDate: range.startDate, endDate: range.endDate }, signal),
    staleTime: DASHBOARD_STALE_TIME_MS,
    enabled,
  });
}

/**
 * Sends a payment reminder through the backend. Success is shown only after
 * the server confirms; the dashboard is then refetched so totals update.
 */
export function useSendPaymentReminder() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const toast = useToast();

  return useMutation({
    mutationFn: (bookingId: string) => facilityDashboardService.sendPaymentReminder(bookingId),
    onSuccess: () => {
      toast.show('Reminder sent');
      return queryClient.invalidateQueries({ queryKey: facilityDashboardKeys.facility(session.facility.id) });
    },
    onError: (error) => {
      const { title, message } = toUserFacingError(error, "Couldn't send reminder");
      toast.show(`${title}. ${message}`, 'error');
    },
  });
}

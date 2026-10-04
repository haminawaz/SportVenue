import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { qk } from '@/api/queryKeys';
import { useAppMutation } from '@/api/useAppMutation';
import type { BusinessHoursDay, Facility, FacilitySettings } from '@/domain/types';
import { useAuth } from '@/session/SessionProvider';

export type FacilityPatch = Partial<Omit<Facility, 'id' | 'businessHours' | 'settings'>> & { settings?: Partial<FacilitySettings> };

export const facilityService = {
  get: () => apiRequest<Facility>('/api/facility'),
  update: (input: FacilityPatch) => apiRequest<Facility>('/api/facility', { method: 'PATCH', body: input }),
  updateHours: (businessHours: BusinessHoursDay[]) => apiRequest<Facility>('/api/facility/hours', { method: 'PUT', body: { businessHours } }),
};

export function useFacility() {
  return useQuery({ queryKey: qk.facility, queryFn: facilityService.get, staleTime: 5 * 60_000 });
}

/** Everything is rendered in the facility's currency and zone, so a change there refreshes all server data. */
const everything = Object.values(qk);

export function useUpdateFacility(successMessage = 'Facility saved') {
  const { updateFacilityContext } = useAuth();
  return useAppMutation({
    mutationFn: facilityService.update,
    invalidate: everything,
    successMessage,
    errorTitle: "Couldn't save facility",
    onSuccess: (f) => updateFacilityContext({ name: f.name, currency: f.currency, timezone: f.timezone }),
  });
}

export function useUpdateHours() {
  return useAppMutation({
    mutationFn: facilityService.updateHours,
    invalidate: [qk.facility, qk.availability, qk.dashboard, qk.analytics, qk.courts],
    successMessage: 'Business hours saved',
    errorTitle: "Couldn't save hours",
  });
}

import { apiRequest } from '@/api/client';

import type { DashboardQueryParams, FacilityDashboard } from '../types/facilityDashboard.types';

export const facilityDashboardService = {
  getDashboard(params: DashboardQueryParams, signal?: AbortSignal): Promise<FacilityDashboard> {
    return apiRequest<FacilityDashboard>('/api/owner/dashboard', {
      query: { facilityId: params.facilityId, startDate: params.startDate, endDate: params.endDate },
      signal,
    });
  },

  async sendPaymentReminder(bookingId: string): Promise<void> {
    await apiRequest<void>(`/api/bookings/${encodeURIComponent(bookingId)}/payment-reminders`, { method: 'POST' });
  },
};

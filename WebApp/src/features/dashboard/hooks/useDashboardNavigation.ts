'use client';

import { useMemo } from 'react';

import type { CalendarDate } from '@/lib/datetime';
import { dashboardDestinations } from '@/navigation/dashboardDestinations';
import { routes, type Href } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { useToast } from '@/ui/Toast';

/** Navigation handlers for the dashboard. Only IDs are passed; destinations load their own data. */
export function useDashboardNavigation() {
  const router = useAppRouter();
  const toast = useToast();

  return useMemo(() => {
    const go = (href: Href | null) => {
      if (href) router.push(href);
      else toast.show('That screen is not available in this build yet.', 'error');
    };
    return {
      openCourtDay: (courtId: string, date: CalendarDate) => go(dashboardDestinations.courtDay(courtId, date)),
      openBooking: (bookingId: string) => go(dashboardDestinations.bookingDetail(bookingId)),
      openCustomer: (customerId: string) => go(dashboardDestinations.customerDetail(customerId)),
      openNewBooking: () => go(dashboardDestinations.newBooking()),
      openOpportunity: (id: string) => go(routes.opportunity(id)),
      openOpportunities: () => go(routes.opportunities),
      openNotifications: () => go(routes.notifications),
      openOutstanding: () => go(routes.payments('outstanding')),
      openRecordPayment: (bookingId: string) => go(routes.recordPayment(bookingId)),
      openBookings: () => go(routes.bookings),
      openCourts: () => go(routes.courts),
      openNewCustomer: () => go(routes.customerNew()),
    };
  }, [router, toast]);
}

/**
 * Dashboard response contract (proposal, see docs/facility-dashboard-api.md).
 * Money is in major units of `currency`. Timestamps without an offset are
 * facility-local wall time.
 */

import type { CalendarDate } from '@/lib/datetime';

export type BookingStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'CANCELLED' | 'PENDING';

export const KNOWN_OPPORTUNITY_TYPES = [
  'LOW_UTILIZATION',
  'OUTSTANDING_PAYMENT',
  'CANCELLATION_RISK',
  'REPEAT_CUSTOMER',
  'PRICE_OPPORTUNITY',
  'FULLY_BOOKED_PERIOD',
] as const;

export type KnownOpportunityType = (typeof KNOWN_OPPORTUNITY_TYPES)[number];

export type RecommendedAction = {
  type: 'DISCOUNT' | 'PRICE_INCREASE' | 'REMIND' | 'CONTACT' | (string & {});
  value?: number;
  unit?: 'PERCENT' | 'AMOUNT' | (string & {});
};

export type Opportunity = {
  id: string;
  /** Unknown future types are tolerated and rendered generically. */
  type: KnownOpportunityType | (string & {});
  title: string;
  description?: string;
  courtId?: string;
  courtName?: string;
  bookingId?: string;
  customerId?: string;
  startAt?: string;
  endAt?: string;
  recommendedAction?: RecommendedAction;
};

export type CourtUtilization = {
  id: string;
  name: string;
  sport?: string;
  utilizationPercentage: number;
  bookedSlots: number;
  totalSlots: number;
  revenue?: number;
};

export type OutstandingPayment = {
  bookingId: string;
  customerId?: string;
  customerName: string;
  courtName: string;
  startAt: string;
  endAt: string;
  outstandingAmount: number;
  currency: string;
  status: BookingStatus;
};

export type RecentBooking = {
  bookingId: string;
  customerName: string;
  courtName: string;
  startAt: string;
  endAt: string;
  amount: number;
  status: BookingStatus;
};

export type FacilityDashboard = {
  period: { startDate: CalendarDate; endDate: CalendarDate };
  currency: string;
  summary: {
    revenue: { amount: number; changePercent?: number | null };
    bookings: { count: number; change?: number | null };
    utilization: { percentage: number; bookedSlots: number; totalSlots: number; changePercent?: number | null };
    outstanding: { amount: number; bookingCount: number };
  };
  courts: CourtUtilization[];
  opportunities: Opportunity[];
  outstandingPayments: OutstandingPayment[];
  recentBookings: RecentBooking[];
  /** Backend-declared actions available for this facility. Absent means unavailable. */
  capabilities?: { paymentReminders?: boolean };
};

export type DateRangePreset = 'today' | 'yesterday' | 'this_week' | 'custom';

export type DateRange = {
  preset: DateRangePreset;
  startDate: CalendarDate;
  endDate: CalendarDate;
};

export type DashboardQueryParams = {
  facilityId: string;
  startDate: CalendarDate;
  endDate: CalendarDate;
};

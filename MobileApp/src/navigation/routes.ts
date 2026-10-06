import type { Href } from 'expo-router';

import type { CalendarDate } from '@/lib/datetime';

/** Every route in the app, built in one place so links stay consistent. */
const q = (params: Record<string, string | undefined>) => {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join('&');
  return s ? `?${s}` : '';
};
const e = encodeURIComponent;

export const routes = {
  home: '/' as Href,
  bookings: '/bookings' as Href,
  courts: '/courts' as Href,
  customers: '/customers' as Href,
  more: '/more' as Href,

  booking: (id: string) => `/booking/${e(id)}` as Href,
  bookingEdit: (id: string) => `/booking/${e(id)}/edit` as Href,
  bookingReschedule: (id: string) => `/booking/${e(id)}/reschedule` as Href,
  bookingNew: (p: { courtId?: string; date?: CalendarDate; startAt?: string; customerId?: string } = {}) => `/booking/new${q(p)}` as Href,

  court: (id: string) => `/court/${e(id)}` as Href,
  courtEdit: (id: string) => `/court/${e(id)}/edit` as Href,
  courtCalendar: (id: string, date?: CalendarDate) => `/court/${e(id)}/calendar${q({ date })}` as Href,
  courtNew: '/court/new' as Href,

  customer: (id: string) => `/customer/${e(id)}` as Href,
  customerEdit: (id: string) => `/customer/${e(id)}/edit` as Href,
  customerBookings: (id: string) => `/customer/${e(id)}/bookings` as Href,
  customerPayments: (id: string) => `/customer/${e(id)}/payments` as Href,
  customerNew: (p: { returnTo?: 'booking' } = {}) => `/customer/new${q(p)}` as Href,

  payments: (tab?: 'outstanding' | 'history') => `/payments${q({ tab })}` as Href,
  payment: (id: string) => `/payments/${e(id)}` as Href,
  recordPayment: (bookingId: string, full?: boolean) => `/payments/record${q({ bookingId, full: full ? '1' : undefined })}` as Href,

  opportunities: '/opportunities' as Href,
  opportunity: (id: string) => `/opportunities/${e(id)}` as Href,


  pricing: (courtId?: string) => `/pricing${q({ courtId })}` as Href,
  pricingRule: (id: string) => `/pricing/rules/${e(id)}` as Href,
  pricingRuleNew: (p: { courtId?: string; weekdays?: string; startTime?: string; endTime?: string; name?: string; opportunityId?: string } = {}) =>
    `/pricing/rules/new${q(p)}` as Href,
  discount: (id: string) => `/pricing/discounts/${e(id)}` as Href,
  discountEdit: (id: string) => `/pricing/discounts/${e(id)}/edit` as Href,
  discountNew: (p: { courtId?: string; value?: string; kind?: string; weekdays?: string; startTime?: string; endTime?: string; name?: string; opportunityId?: string } = {}) =>
    `/pricing/discounts/new${q(p)}` as Href,
  pricingHistory: '/pricing/history' as Href,

  facility: '/facility' as Href,
  facilityEdit: '/facility/edit' as Href,
  facilityHours: '/facility/hours' as Href,
  facilitySettings: '/facility/settings' as Href,

  notifications: '/notifications' as Href,
  notification: (id: string) => `/notifications/${e(id)}` as Href,

  settings: '/settings' as Href,
  profile: '/settings/profile' as Href,
  notificationPreferences: '/settings/notifications' as Href,
  billing: '/settings/billing' as Href,
  signIn: '/sign-in' as Href,
};

/**
 * Query key roots. Mutations invalidate by root so every screen showing
 * that data refreshes; server-computed totals (dashboard, balances,
 * analytics) are always refetched rather than patched on the client.
 */
export const qk = {
  me: ['me'] as const,
  dashboard: ['facility-dashboard'] as const,
  analytics: ['analytics'] as const,
  facility: ['facility'] as const,
  courts: ['courts'] as const,
  availability: ['availability'] as const,
  bookings: ['bookings'] as const,
  quote: ['booking-quote'] as const,
  customers: ['customers'] as const,
  payments: ['payments'] as const,
  opportunities: ['opportunities'] as const,
  pricing: ['pricing'] as const,
  notifications: ['notifications'] as const,
  billing: ['billing'] as const,
  preferences: ['preferences'] as const,
};

/** Everything a booking or payment change can affect. */
export const bookingEffects = [qk.bookings, qk.availability, qk.dashboard, qk.analytics, qk.customers, qk.payments, qk.courts, qk.opportunities, qk.notifications];

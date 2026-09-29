import type { Facility, UserProfile } from '@/domain/types';

export const PERMISSIONS = [
  'dashboard.view',
  'analytics.view',
  'booking.view',
  'booking.create',
  'booking.manage',
  'payment.view',
  'payment.record',
  'payment.remind',
  'customer.view',
  'customer.manage',
  'court.view',
  'court.manage',
  'pricing.view',
  'pricing.manage',
  'opportunity.view',
  'opportunity.manage',
  'facility.manage',
  'billing.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];


export type FacilityContext = {
  id: string;
  name: string;
  /** IANA zone, for example "Asia/Karachi". All dates use this, never the phone's zone. */
  timezone: string;
  /** ISO 4217 code configured for the facility. */
  currency: string;
};

export type Session = {
  user: Pick<UserProfile, 'id' | 'firstName' | 'lastName' | 'email' | 'role'> & { phone?: string };
  /**
   * The facility the user is operating. Display/selection context only:
   * the backend authorises every request against the access token.
   */
  facility: FacilityContext;
  /** Permissions resolved by the backend for this user and facility. */
  permissions: readonly Permission[];
};

/** Shape of GET /api/me. */
export type MeResponse = { user: UserProfile; facility: Facility; permissions: Permission[] };


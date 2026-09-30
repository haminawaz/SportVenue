import type { Facility, UserProfile } from '@/domain/types';

export type FacilityContext = {
  id: string;
  name: string;
  /** IANA zone, for example "Asia/Karachi". All dates use this, never the phone's zone. */
  timezone: string;
  /** ISO 4217 code configured for the facility. */
  currency: string;
};

/**
 * SportVenue has exactly one role: the facility owner. A signed-in session can
 * do everything in the app; the backend still authorises every request
 * against the access token.
 */
export type Session = {
  user: Pick<UserProfile, 'id' | 'firstName' | 'lastName' | 'email' | 'role'> & { phone?: string };
  /** The facility the owner is operating. Display/selection context only. */
  facility: FacilityContext;
};

/** Shape of GET /api/me. */
export type MeResponse = { user: UserProfile; facility: Facility };

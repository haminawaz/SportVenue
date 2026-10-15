/**
 * Mock data configuration (same rules as the web app).
 *
 * Mocks are on when:
 *   1. EXPO_PUBLIC_USE_MOCKS is '1' or 'true', OR
 *   2. EXPO_PUBLIC_API_URL is not set and EXPO_PUBLIC_USE_MOCKS is not '0' or 'false'.
 *
 * Development and release builds (EAS preview and production) therefore run
 * on the seeded demo data out of the box. Set EXPO_PUBLIC_API_URL (and
 * EXPO_PUBLIC_USE_MOCKS=0) for a build that talks to the live backend.
 *
 * Expo inlines EXPO_PUBLIC_* at build time only for direct property access,
 * so each variable is read as process.env.EXPO_PUBLIC_NAME.
 */
const rawUseMocks = process.env.EXPO_PUBLIC_USE_MOCKS;

export const USE_MOCKS =
  rawUseMocks === '1' || rawUseMocks === 'true' || (!process.env.EXPO_PUBLIC_API_URL && rawUseMocks !== '0' && rawUseMocks !== 'false');

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

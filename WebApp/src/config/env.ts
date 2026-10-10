/**
 * Mock data configuration.
 *
 * Mocks are enabled if:
 *   1. NEXT_PUBLIC_USE_MOCKS is explicitly set to '1' or 'true', OR
 *   2. NEXT_PUBLIC_API_URL is not set (empty/undefined) and NEXT_PUBLIC_USE_MOCKS is not explicitly set to '0' or 'false'.
 *
 * This allows both local development and hosted demos (such as Vercel preview/production deployments)
 * to run with seeded mock data out of the box when no backend API URL is configured.
 * When NEXT_PUBLIC_API_URL is provided, requests will hit the live backend unless NEXT_PUBLIC_USE_MOCKS=1 is set.
 */
const rawUseMocks = process.env.NEXT_PUBLIC_USE_MOCKS;

export const USE_MOCKS =
  rawUseMocks === '1' ||
  rawUseMocks === 'true' ||
  (!process.env.NEXT_PUBLIC_API_URL && rawUseMocks !== '0' && rawUseMocks !== 'false');

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

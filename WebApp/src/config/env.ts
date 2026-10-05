/**
 * Development boundary for mock data.
 *
 * Mocks are used only when BOTH are true:
 *   - this is a development build (NODE_ENV is not "production")
 *   - NEXT_PUBLIC_USE_MOCKS=1 is set explicitly
 *
 * A production build can never read mock data, even if the variable leaks:
 * NODE_ENV is inlined at build time, so the mock server is dropped from the bundle.
 */
export const USE_MOCKS = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_USE_MOCKS === '1';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

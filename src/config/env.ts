/**
 * Development boundary for mock data.
 *
 * Mocks are used only when BOTH are true:
 *   - this is a development build (__DEV__)
 *   - EXPO_PUBLIC_USE_MOCKS=1 is set explicitly
 *
 * A production build can never read mock data, even if the variable leaks.
 */
export const USE_MOCKS = __DEV__ && process.env.EXPO_PUBLIC_USE_MOCKS === '1';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

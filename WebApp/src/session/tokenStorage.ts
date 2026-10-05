const KEY = 'sportvenue.accessToken';

/**
 * Access token storage. Browsers have no secure keychain: the token lives in
 * sessionStorage, so it survives a reload but ends with the tab and is never
 * written to localStorage. (The mobile app uses the device keychain instead.)
 */
function webStore(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export const tokenStorage = {
  async get(): Promise<string | null> {
    try {
      return webStore()?.getItem(KEY) ?? null;
    } catch {
      return null;
    }
  },
  async set(token: string) {
    try {
      webStore()?.setItem(KEY, token);
    } catch {
      // Storage blocked: the session simply won't survive a reload.
    }
  },
  async clear() {
    try {
      webStore()?.removeItem(KEY);
    } catch {
      // Nothing stored.
    }
  },
};

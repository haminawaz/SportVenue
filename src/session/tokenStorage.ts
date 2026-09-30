import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'sportvenue.accessToken';

/**
 * Access token storage. Uses the device keychain/keystore on iOS and Android.
 * Web has no secure store: the token lives in sessionStorage, so it survives a
 * reload but ends with the tab and is never written to localStorage.
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
    if (Platform.OS === 'web') {
      try {
        return webStore()?.getItem(KEY) ?? null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(KEY);
    } catch {
      return null;
    }
  },
  async set(token: string) {
    if (Platform.OS === 'web') {
      try {
        webStore()?.setItem(KEY, token);
      } catch {
        // Storage blocked: the session simply won't survive a reload.
      }
      return;
    }
    await SecureStore.setItemAsync(KEY, token);
  },
  async clear() {
    if (Platform.OS === 'web') {
      try {
        webStore()?.removeItem(KEY);
      } catch {
        // Nothing stored.
      }
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  },
};

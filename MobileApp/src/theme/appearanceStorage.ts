import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type Appearance = 'system' | 'light' | 'dark';

const KEY = 'sportvenue.appearance';

function isAppearance(v: unknown): v is Appearance {
  return v === 'system' || v === 'light' || v === 'dark';
}

/**
 * Remembers the owner's light/dark choice on this device. A convenience only:
 * if storage is unavailable the app simply follows the system setting.
 */
export const appearanceStorage = {
  async get(): Promise<Appearance | null> {
    try {
      const raw = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null) : await SecureStore.getItemAsync(KEY);
      return isAppearance(raw) ? raw : null;
    } catch {
      return null;
    }
  },
  async set(value: Appearance) {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.localStorage.setItem(KEY, value);
        return;
      }
      await SecureStore.setItemAsync(KEY, value);
    } catch {
      // Storage blocked: the choice lasts for this session only.
    }
  },
};

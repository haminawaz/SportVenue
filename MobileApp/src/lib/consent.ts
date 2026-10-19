import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * The owner's choices about optional storage ("Privacy choices"; the cookie
 * banner on web). Same rules as the web app:
 *
 * Strictly necessary storage (sign-in, the theme you pick, these choices) is
 * always on and needs no consent. Analytics is the only optional category, and
 * no analytics tool exists today. Any optional tool added later must check
 * hasConsent() first and stay off until it returns true.
 *
 * Kept in the device's secure storage (localStorage on web) for 12 months,
 * then the banner asks again.
 */

export type ConsentChoices = { analytics: boolean };

export type ConsentRecord = { version: 1; choices: ConsentChoices; decidedAt: string };

export const CONSENT_KEY = 'sportvenue.consent';

const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

function parse(raw: string | null): ConsentRecord | null {
  if (!raw) return null;
  try {
    const record = JSON.parse(raw) as ConsentRecord;
    const age = Date.now() - Date.parse(record.decidedAt);
    if (record.version !== 1 || typeof record.choices?.analytics !== 'boolean' || !(age >= 0 && age < MAX_AGE_MS)) return null;
    return record;
  } catch {
    return null;
  }
}

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') return typeof window !== 'undefined' ? window.localStorage.getItem(CONSENT_KEY) : null;
  return SecureStore.getItemAsync(CONSENT_KEY);
}

async function writeRaw(value: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(CONSENT_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(CONSENT_KEY, value);
}

/** undefined until read from storage, then the record or null (not decided yet). */
let cache: ConsentRecord | null | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const consentStore = {
  get(): ConsentRecord | null | undefined {
    return cache;
  },
  async load() {
    if (cache !== undefined) return cache;
    try {
      cache = parse(await readRaw());
    } catch {
      cache = null;
    }
    emit();
    return cache;
  },
  async set(choices: ConsentChoices) {
    const record: ConsentRecord = { version: 1, choices, decidedAt: new Date().toISOString() };
    cache = record;
    emit();
    try {
      await writeRaw(JSON.stringify(record));
    } catch {
      // Storage unavailable: the choice lasts until the app closes.
    }
  },
  subscribe(onChange: () => void) {
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  },
};

/** Gate for optional tools: true only after the owner switched the category on. */
export function hasConsent(category: keyof ConsentChoices): boolean {
  return cache?.choices[category] === true;
}

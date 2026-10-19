/**
 * The visitor's choices about optional storage (the cookie banner).
 *
 * Strictly necessary storage (sign-in, navigation, the theme you pick, these
 * choices) is always on and needs no consent. Analytics is the only optional
 * category, and no analytics tool exists today. Any optional tool added later
 * must check hasConsent() first and stay off until it returns true.
 *
 * Choices are kept for 12 months, then the banner asks again.
 */

export type ConsentChoices = { analytics: boolean };

export type ConsentRecord = { version: 1; choices: ConsentChoices; decidedAt: string };

export const CONSENT_KEY = 'sportvenue.consent';

const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const CHANGE_EVENT = 'sportvenue:consent';

function load(): ConsentRecord | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as ConsentRecord;
    const age = Date.now() - Date.parse(record.decidedAt);
    if (record.version !== 1 || typeof record.choices?.analytics !== 'boolean' || !(age >= 0 && age < MAX_AGE_MS)) return null;
    return record;
  } catch {
    return null;
  }
}

// One cached object per change, so useSyncExternalStore sees a stable snapshot.
let cache: ConsentRecord | null | undefined;

export const consentStore = {
  get(): ConsentRecord | null {
    if (cache === undefined) cache = load();
    return cache;
  },
  set(choices: ConsentChoices) {
    const record: ConsentRecord = { version: 1, choices, decidedAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    } catch {
      // Storage blocked: the choice lasts for this page load only.
    }
    cache = record;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  },
  subscribe(onChange: () => void) {
    // Another tab changed the choice.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CONSENT_KEY && e.key !== null) return;
      cache = undefined;
      onChange();
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  },
};

/** Gate for optional tools: true only after the visitor switched the category on. */
export function hasConsent(category: keyof ConsentChoices): boolean {
  return typeof window !== 'undefined' && consentStore.get()?.choices[category] === true;
}

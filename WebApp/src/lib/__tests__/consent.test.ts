import { CONSENT_KEY, consentStore, hasConsent } from '../consent';

/** The store caches its snapshot; a fresh module per test starts from storage again. */
async function freshStore() {
  vi.resetModules();
  return import('../consent');
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('consent store', () => {
  it('has no record and no consent before the visitor chooses', async () => {
    const { consentStore: store, hasConsent: has } = await freshStore();
    expect(store.get()).toBeNull();
    expect(has('analytics')).toBe(false);
  });

  it('saves a choice, notifies subscribers and gates optional tools', () => {
    const onChange = vi.fn();
    const unsubscribe = consentStore.subscribe(onChange);
    consentStore.set({ analytics: true });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(hasConsent('analytics')).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(CONSENT_KEY)!).choices).toEqual({ analytics: true });

    consentStore.set({ analytics: false });
    expect(hasConsent('analytics')).toBe(false);
    unsubscribe();
  });

  it('asks again once a choice is older than 12 months', async () => {
    const old = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString();
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: 1, choices: { analytics: true }, decidedAt: old }));
    const { consentStore: store, hasConsent: has } = await freshStore();
    expect(store.get()).toBeNull();
    expect(has('analytics')).toBe(false);
  });

  it('ignores stored values it does not recognise', async () => {
    window.localStorage.setItem(CONSENT_KEY, '{"version":1,"choices":{"analytics":"yes"},"decidedAt":"2026-01-01T00:00:00Z"}');
    expect((await freshStore()).consentStore.get()).toBeNull();
    window.localStorage.setItem(CONSENT_KEY, 'not json');
    expect((await freshStore()).consentStore.get()).toBeNull();
  });
});

const mockSecure = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (k: string) => mockSecure.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => {
    mockSecure.set(k, v);
  }),
}));

/** The store caches what it read; each test loads a fresh copy. */
function freshStore() {
  jest.resetModules();
  return jest.requireActual<typeof import('../consent')>('../consent');
}

beforeEach(() => mockSecure.clear());

describe('consent store (device)', () => {
  it('is unknown until loaded, then empty before the owner chooses', async () => {
    const { consentStore, hasConsent } = freshStore();
    expect(consentStore.get()).toBeUndefined();
    expect(await consentStore.load()).toBeNull();
    expect(hasConsent('analytics')).toBe(false);
  });

  it('saves a choice to secure storage and notifies subscribers', async () => {
    const { consentStore, hasConsent, CONSENT_KEY } = freshStore();
    await consentStore.load();
    const onChange = jest.fn();
    consentStore.subscribe(onChange);
    await consentStore.set({ analytics: true });
    expect(onChange).toHaveBeenCalled();
    expect(hasConsent('analytics')).toBe(true);
    expect(JSON.parse(mockSecure.get(CONSENT_KEY)!).choices).toEqual({ analytics: true });

    const again = freshStore();
    expect((await again.consentStore.load())?.choices).toEqual({ analytics: true });
  });

  it('asks again after 12 months', async () => {
    const old = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString();
    mockSecure.set('sportvenue.consent', JSON.stringify({ version: 1, choices: { analytics: true }, decidedAt: old }));
    const { consentStore, hasConsent } = freshStore();
    expect(await consentStore.load()).toBeNull();
    expect(hasConsent('analytics')).toBe(false);
  });
});

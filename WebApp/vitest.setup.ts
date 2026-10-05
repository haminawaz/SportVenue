import '@testing-library/jest-dom/vitest';

// Screens read the facility's timezone explicitly; pin the test process zone
// to something different so any accidental use of the browser zone shows up.
process.env.TZ = 'America/Los_Angeles';

// jsdom has no IntersectionObserver or matchMedia; lists and theme code use both.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
Object.assign(globalThis, { IntersectionObserver: IntersectionObserverStub });

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

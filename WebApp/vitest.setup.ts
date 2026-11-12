import '@testing-library/jest-dom/vitest';
import * as domMatchers from '@testing-library/jest-dom/matchers';

// With `globals: true`, this Vitest hands tests a global `expect` that is not
// the one `@testing-library/jest-dom/vitest` extends, so extend it as well.
(globalThis as { expect?: { extend: (matchers: typeof domMatchers) => void } }).expect?.extend(domMatchers);

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

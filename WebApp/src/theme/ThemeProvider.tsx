'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';

import { appearanceStorage, type Appearance } from './appearanceStorage';
import { colors, type ColorTokens } from './tokens';

export type { Appearance };

type Theme = {
  scheme: 'light' | 'dark';
  /** Theme tokens as CSS variable references; they follow the active scheme automatically. */
  colors: ColorTokens;
  /** What the owner picked in Settings. "system" follows the device. */
  appearance: Appearance;
  setAppearance: (next: Appearance) => void;
};

const ThemeContext = createContext<Theme>({ scheme: 'light', colors, appearance: 'system', setAppearance: () => {} });

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeSystem(onChange: () => void) {
  const mql = window.matchMedia(DARK_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

const systemIsDark = () => window.matchMedia(DARK_QUERY).matches;

/** The theme is set once at the app root; screens and sections never override it. */
export function ThemeProvider({ children, scheme: forced }: { children: ReactNode; scheme?: 'light' | 'dark' }) {
  const systemDark = useSyncExternalStore(subscribeSystem, systemIsDark, () => false);
  const [appearance, setAppearanceState] = useState<Appearance>('system');

  useEffect(() => {
    const saved = appearanceStorage.get();
    // Reading browser storage has to wait until after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setAppearanceState(saved);
  }, []);

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next);
    appearanceStorage.set(next);
  }, []);

  const scheme = forced ?? (appearance === 'system' ? (systemDark ? 'dark' : 'light') : appearance);

  useEffect(() => {
    if (forced) return;
    document.documentElement.setAttribute('data-theme', scheme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', scheme === 'dark' ? '#121211' : '#F3F1EE');
  }, [scheme, forced]);

  const value = useMemo<Theme>(() => ({ scheme, colors, appearance, setAppearance }), [scheme, appearance, setAppearance]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

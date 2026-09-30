import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { appearanceStorage, type Appearance } from './appearanceStorage';
import { palette, type ColorTokens } from './tokens';

export type { Appearance };

type Theme = {
  scheme: 'light' | 'dark';
  colors: ColorTokens;
  /** What the owner picked in Settings. "system" follows the phone. */
  appearance: Appearance;
  setAppearance: (next: Appearance) => void;
};

const ThemeContext = createContext<Theme>({ scheme: 'light', colors: palette.light, appearance: 'system', setAppearance: () => {} });

/** The theme is set once at the app root; screens and sections never override it. */
export function ThemeProvider({ children, scheme: forced }: { children: ReactNode; scheme?: 'light' | 'dark' }) {
  const system = useColorScheme();
  const [appearance, setAppearanceState] = useState<Appearance>('system');

  useEffect(() => {
    let cancelled = false;
    appearanceStorage.get().then((saved) => {
      if (!cancelled && saved) setAppearanceState(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next);
    void appearanceStorage.set(next);
  }, []);

  const scheme = forced ?? (appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance);
  const value = useMemo<Theme>(() => ({ scheme, colors: palette[scheme], appearance, setAppearance }), [scheme, appearance, setAppearance]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

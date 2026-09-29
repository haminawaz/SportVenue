import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { palette, type ColorTokens } from './tokens';

type Theme = { scheme: 'light' | 'dark'; colors: ColorTokens };

const ThemeContext = createContext<Theme>({ scheme: 'light', colors: palette.light });

/** Follows the system colour scheme; the theme is set once at the app root. */
export function ThemeProvider({ children, scheme: forced }: { children: ReactNode; scheme?: 'light' | 'dark' }) {
  const system = useColorScheme();
  const scheme = forced ?? (system === 'dark' ? 'dark' : 'light');
  const value = useMemo<Theme>(() => ({ scheme, colors: palette[scheme] }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

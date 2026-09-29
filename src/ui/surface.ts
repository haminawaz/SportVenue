import { StyleSheet, useWindowDimensions, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius, spacing } from '@/theme/tokens';

export type SurfaceTint = 'surface' | 'accent' | 'warning' | 'muted';

/**
 * One elevation language for every card-like surface.
 * Light: soft tinted shadow, no border. Dark: hairline border, no shadow.
 */
export function useSurface(tint: SurfaceTint = 'surface'): ViewStyle {
  const { colors, scheme } = useTheme();
  const bg =
    tint === 'accent' ? colors.accentSoft : tint === 'warning' ? colors.warningSoft : tint === 'muted' ? colors.surfaceMuted : colors.surface;
  if (scheme === 'dark' || tint !== 'surface') {
    return { backgroundColor: bg, borderRadius: radius.card, borderWidth: scheme === 'dark' && tint === 'surface' ? StyleSheet.hairlineWidth : 0, borderColor: colors.border };
  }
  return { backgroundColor: bg, borderRadius: radius.card, shadowColor: colors.shadow, ...elevation.card };
}

export const GUTTER = spacing.xl;
export const TILE_GAP = spacing.md;

/** Width of a half-width tile; full width when the user runs very large text. */
export function tileWidth(screenWidth: number, fontScale: number) {
  const inner = Math.min(screenWidth, 720) - GUTTER * 2;
  if (fontScale >= 1.3) return inner;
  return Math.floor((inner - TILE_GAP) / 2);
}

export function useTileWidth() {
  const { width, fontScale } = useWindowDimensions();
  const half = tileWidth(width, fontScale);
  const full = Math.min(width, 720) - GUTTER * 2;
  return { half, full };
}

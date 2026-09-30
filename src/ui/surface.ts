import { StyleSheet, useWindowDimensions, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius, spacing } from '@/theme/tokens';

export type SurfaceTint = 'surface' | 'accent' | 'warning' | 'muted';

/**
 * One elevation language for every card-like surface.
 * Light: lifted surface on the stone canvas with a hairline edge and a wide,
 * soft shadow. Dark: a surface step plus a hairline edge, no shadow.
 * Tinted surfaces (accent, warning, muted) are flat: colour already groups them.
 */
export function useSurface(tint: SurfaceTint = 'surface'): ViewStyle {
  const { colors, scheme } = useTheme();
  const bg =
    tint === 'accent' ? colors.accentSoft : tint === 'warning' ? colors.warningSoft : tint === 'muted' ? colors.surfaceMuted : colors.surface;
  if (tint !== 'surface') return { backgroundColor: bg, borderRadius: radius.card };
  const edge = { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border };
  if (scheme === 'dark') return { backgroundColor: bg, borderRadius: radius.card, ...edge };
  return { backgroundColor: bg, borderRadius: radius.card, ...edge, shadowColor: colors.shadow, ...elevation.card };
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

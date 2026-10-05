import { spacing } from '@/theme/tokens';

export type SurfaceTint = 'surface' | 'accent' | 'warning' | 'muted';

/**
 * One elevation language for every card-like surface.
 * Light: white surface on the stone canvas with a hairline edge and a faint
 * shadow. Dark: a surface step plus a hairline edge, no shadow.
 * Tinted surfaces (accent, warning, muted) are flat: colour already groups them.
 */
export function surfaceClass(tint: SurfaceTint = 'surface') {
  switch (tint) {
    case 'accent':
      return 'bg-accent-soft rounded-card';
    case 'warning':
      return 'bg-warning-soft rounded-card';
    case 'muted':
      return 'bg-surface-muted rounded-card';
    default:
      return 'surface-card';
  }
}

export const GUTTER = spacing.xl;
export const TILE_GAP = spacing.md;
export const MAX_CONTENT = 720;

/**
 * Width of a half-width tile on a phone; full width when the user runs very
 * large text. Kept as the shared narrow-screen rule the KPI layout is tested
 * against (wider screens lay tiles out in a CSS grid).
 */
export function tileWidth(screenWidth: number, fontScale: number) {
  const inner = Math.min(screenWidth, MAX_CONTENT) - GUTTER * 2;
  if (fontScale >= 1.3) return inner;
  return Math.floor((inner - TILE_GAP) / 2);
}

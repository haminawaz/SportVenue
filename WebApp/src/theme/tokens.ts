/**
 * SportVenue design tokens (v4, "stone and ink").
 *
 * Visual language: a warm stone canvas, ink-black primary actions, soft
 * oversized radii and one court-green signal colour. Editorial and calm on the
 * marketing page, readable and spacious in the app.
 *
 * The colour values live as CSS variables in app/globals.css (light and dark
 * under :root[data-theme]); Tailwind exposes them as bg-surface, text-accent,
 * and so on. `colors` below gives the same tokens as var() references for the
 * few places that need a colour in an inline style.
 *
 * Shape rule (small, large or pill; the 8-16 middle ground is not used):
 *   status tags                -> rounded-badge (6)
 *   buttons, inputs            -> rounded-control (20)
 *   cards, list groups         -> rounded-card (28)
 *   hero panels, sheets        -> rounded-hero (36)
 *   chips, nav, icon buttons   -> rounded-full (pill / circle)
 *
 * Readability first: body text is 16px, secondary information 14px, every
 * tappable thing is at least 44px tall (52px for primary targets), and the
 * screen gutter is 20px.
 */

const TOKENS = [
  'background',
  'surface',
  'surfaceRaised',
  'surfaceMuted',
  'glass',
  'glassBand',
  'border',
  'borderStrong',
  'text',
  'textMuted',
  'textSubtle',
  'primary',
  'onPrimary',
  'accent',
  'accentStrong',
  'accentSoft',
  'accentDecor',
  'onAccent',
  'ink',
  'onInk',
  'onInkMuted',
  'inkAccent',
  'inkLine',
  'warning',
  'warningSoft',
  'danger',
  'dangerSoft',
  'track',
  'skeleton',
  'backdrop',
  'shadow',
] as const;

export type ColorToken = (typeof TOKENS)[number];
export type ColorTokens = Record<ColorToken, string>;

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Theme-aware colours as CSS variable references, safe to use before hydration. */
export const colors = Object.fromEntries(TOKENS.map((t) => [t, `var(--${kebab(t)})`])) as ColorTokens;

/** 4px grid; section rhythm uses the 8px steps. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  badge: 6,
  control: 20,
  card: 28,
  hero: 36,
  sheet: 36,
  full: 999,
} as const;

/** Minimum touch target. Larger than platform minimums on purpose. */
export const touchTarget = 52;

/** Typography variants, each backed by a `t-<variant>` utility in globals.css. */
export const TYPOGRAPHY_VARIANTS = [
  'display-mega',
  'display-xl',
  'display-lg',
  'display-md',
  'display-sm',
  'title-md',
  'title-sm',
  'body-md',
  'body-strong',
  'body-sm',
  'caption',
  'caption-uppercase',
  'button',
  'nav-link',
  // App (dashboard) scale
  'page-title',
  'stat',
  'heading',
  'text',
  'text-strong',
  'small',
  'label',
  'mini',
  'overline',
] as const;

export type TypographyVariant = (typeof TYPOGRAPHY_VARIANTS)[number];

/** Z-index scale. Only systemic layers get a z-index. */
export const zIndex = {
  header: 30,
  nav: 40,
  sheet: 60,
  toast: 100,
} as const;

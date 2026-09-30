/**
 * SportVenue design tokens (v4, "stone and ink").
 *
 * Visual language: a warm stone canvas, ink-black primary actions, soft
 * oversized radii and one court-green signal colour. Editorial and calm on the
 * marketing page, readable and spacious in the app.
 *
 * Readability first: body text is 16pt, secondary information 14pt at high
 * contrast (12pt captions only for tertiary detail), every tappable thing is
 * at least 52pt tall, and the screen gutter is 20pt.
 *
 * Shape rule (small, large or pill; the 8-16 middle ground is not used):
 *   status tags                -> radius.badge (6)
 *   buttons, inputs            -> radius.control (20)
 *   cards, list groups         -> radius.card (28)
 *   hero panels, sheets        -> radius.hero (36)
 *   chips, nav, icon buttons   -> radius.full (pill / circle)
 *
 * Colour rule: primary actions are ink (cream in dark mode). Court green is
 * the single accent: brand mark, positive status, progress, links and the
 * decorative orbit line. Warning and danger are semantic only and always
 * paired with text. The "ink" surface is the one dark summary card per screen.
 * Elevation: soft, wide, low-opacity shadows in light mode; surface steps in dark.
 */

export const palette = {
  light: {
    background: '#F3F1EE',
    surface: '#FDFCFB',
    surfaceRaised: '#FEFEFD',
    surfaceMuted: '#EAE7E3',
    border: '#E2DED9',
    borderStrong: '#C9C4BD',
    text: '#141413',
    textMuted: '#45433F',
    textSubtle: '#625F5A',
    primary: '#141413',
    onPrimary: '#F3F1EE',
    accent: '#0B7A4B',
    accentStrong: '#075C37',
    accentSoft: '#E1F0E5',
    accentDecor: '#2FBF71',
    onAccent: '#FDFCFB',
    ink: '#141413',
    onInk: '#F3F1EE',
    onInkMuted: '#ACA79F',
    inkAccent: '#4ADE9A',
    inkLine: 'rgba(243, 241, 238, 0.14)',
    warning: '#8A4B00',
    warningSoft: '#F8EBDD',
    danger: '#B3261E',
    dangerSoft: '#FAE6E3',
    track: '#E2DED9',
    skeleton: '#E6E2DD',
    backdrop: 'rgba(20, 20, 19, 0.5)',
    shadow: '#2A2117',
  },
  dark: {
    background: '#121211',
    surface: '#1B1A19',
    surfaceRaised: '#232220',
    surfaceMuted: '#2A2927',
    border: '#33312E',
    borderStrong: '#46433F',
    text: '#F3F1EE',
    textMuted: '#CFCAC3',
    textSubtle: '#A39E97',
    primary: '#F3F1EE',
    onPrimary: '#141413',
    accent: '#3DD68C',
    accentStrong: '#2FB57A',
    accentSoft: '#14281D',
    accentDecor: '#3DD68C',
    onAccent: '#07140D',
    ink: '#201F1D',
    onInk: '#F3F1EE',
    onInkMuted: '#B3AEA7',
    inkAccent: '#4ADE9A',
    inkLine: 'rgba(243, 241, 238, 0.12)',
    warning: '#F2B45A',
    warningSoft: '#34260F',
    danger: '#FF8A80',
    dangerSoft: '#3A1714',
    track: '#33312E',
    skeleton: '#262523',
    backdrop: 'rgba(5, 5, 4, 0.72)',
    shadow: '#050504',
  },
} as const;

export type ColorTokens = { [K in keyof typeof palette.light]: string };

/** 4pt grid; section rhythm uses the 8pt steps. */
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

/**
 * Registered font family names (loaded in app/_layout.tsx).
 * Bricolage Grotesque Light carries headlines and figures; Instrument Sans
 * carries everything an owner reads or taps.
 */
export const fontFamily = {
  display: 'BricolageGrotesque-Light',
  regular: 'InstrumentSans-Regular',
  medium: 'InstrumentSans-Medium',
  semibold: 'InstrumentSans-SemiBold',
} as const;

/**
 * SportVenue type scale (exact values from the brand spec).
 * Display styles (Bricolage Grotesque Light) carry headlines and figures;
 * Instrument Sans carries everything an owner reads or taps.
 */
export const typography = {
  'display-mega': { fontFamily: fontFamily.display, fontSize: 40, lineHeight: 42, letterSpacing: -1.2 },
  'display-xl': { fontFamily: fontFamily.display, fontSize: 32, lineHeight: 35, letterSpacing: -0.64 },
  'display-lg': { fontFamily: fontFamily.display, fontSize: 28, lineHeight: 33, letterSpacing: -0.28 },
  'display-md': { fontFamily: fontFamily.display, fontSize: 24, lineHeight: 27, letterSpacing: -0.24 },
  'display-sm': { fontFamily: fontFamily.display, fontSize: 20, lineHeight: 24, letterSpacing: 0 },
  'title-md': { fontFamily: fontFamily.medium, fontSize: 18, lineHeight: 24, letterSpacing: 0 },
  'title-sm': { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 23, letterSpacing: 0.16 },
  'body-md': { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24, letterSpacing: 0.16 },
  'body-strong': { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 24, letterSpacing: 0.16 },
  'body-sm': { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21, letterSpacing: 0.14 },
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, letterSpacing: 0 },
  'caption-uppercase': { fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 15, letterSpacing: 0.9, textTransform: 'uppercase' },
  button: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 16, letterSpacing: 0 },
  'nav-link': { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Z-index scale. Only systemic layers get a z-index. */
export const zIndex = {
  toast: 100,
} as const;

/** Wide, soft, low-opacity lift ("cushioning", not directional light). Light mode only. */
export const elevation = {
  card: { shadowOpacity: 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 2 },
  nav: { shadowOpacity: 0.07, shadowRadius: 24, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  raised: { shadowOpacity: 0.12, shadowRadius: 40, shadowOffset: { width: 0, height: 20 }, elevation: 10 },
} as const;

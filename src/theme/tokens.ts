/**
 * CoyoteOS design tokens (v2, mobile-first).
 *
 * Readability first: body text is 17pt, secondary text never goes below 15pt,
 * every tappable thing is at least 52pt tall, and the screen gutter is 20pt.
 *
 * Shape rule (applies everywhere, do not freelance radii):
 *   cards, hero panels         -> radius.card (20)
 *   bottom sheets, dialogs     -> radius.sheet (28)
 *   buttons, inputs            -> radius.control (14)
 *   chips, segmented tabs      -> radius.full (pill)
 *   status badges              -> radius.badge (8)
 *
 * Colour rule: one brand accent (court green). Warning and danger are
 * semantic only (money owed, unpaid) and always paired with text.
 * Elevation: light mode uses soft green-tinted shadows, dark mode uses borders.
 */

export const palette = {
  light: {
    background: '#F2F4F1',
    surface: '#FEFEFD',
    surfaceMuted: '#EBEEE9',
    border: '#DDE2DB',
    text: '#111612',
    textMuted: '#465047',
    textSubtle: '#5F6A60',
    accent: '#0B7A4B',
    accentStrong: '#0A4D31',
    accentSoft: '#DFF1E6',
    onAccent: '#FEFEFD',
    heroText: '#FEFEFD',
    heroMuted: '#B9DCC8',
    warning: '#8F5300',
    warningSoft: '#FCEFD9',
    danger: '#B3261E',
    dangerSoft: '#FCE8E6',
    track: '#DDE2DB',
    skeleton: '#E3E7E1',
    backdrop: 'rgba(17, 22, 18, 0.5)',
    shadow: '#0B2E1C',
  },
  dark: {
    background: '#0B0F0C',
    surface: '#141A16',
    surfaceMuted: '#1C241F',
    border: '#28322B',
    text: '#F1F5F2',
    textMuted: '#BAC5BD',
    textSubtle: '#94A198',
    accent: '#3DD68C',
    accentStrong: '#0F3B26',
    accentSoft: '#11301F',
    onAccent: '#06130C',
    heroText: '#F1F5F2',
    heroMuted: '#9CCDB2',
    warning: '#F2B45A',
    warningSoft: '#33250F',
    danger: '#FF8A80',
    dangerSoft: '#3A1614',
    track: '#28322B',
    skeleton: '#1F2822',
    backdrop: 'rgba(0, 0, 0, 0.65)',
    shadow: '#000000',
  },
} as const;

export type ColorTokens = { [K in keyof typeof palette.light]: string };

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
  badge: 8,
  control: 14,
  card: 20,
  sheet: 28,
  full: 999,
} as const;

/** Minimum touch target. Larger than platform minimums on purpose. */
export const touchTarget = 52;

export const fontFamily = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fontFamily.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.9 },
  title: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  heading: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  metric: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.7 },
  bodyStrong: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 24, letterSpacing: -0.1 },
  body: { fontFamily: fontFamily.regular, fontSize: 17, lineHeight: 24, letterSpacing: -0.1 },
  label: { fontFamily: fontFamily.medium, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 21 },
  badge: { fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 16, letterSpacing: 0.1 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Z-index scale. Only systemic layers get a z-index. */
export const zIndex = {
  toast: 100,
} as const;

/** Soft elevation for light mode cards; dark mode relies on borders instead. */
export const elevation = {
  card: { shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  raised: { shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
} as const;

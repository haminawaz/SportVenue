import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { typography, type ColorTokens, type TypographyVariant } from '@/theme/tokens';

type Tone = 'default' | 'muted' | 'subtle' | 'accent' | 'warning' | 'danger' | 'onAccent';

const toneToColor: Record<Tone, keyof ColorTokens> = {
  default: 'text',
  muted: 'textMuted',
  subtle: 'textSubtle',
  accent: 'accent',
  warning: 'warning',
  danger: 'danger',
  onAccent: 'onAccent',
};

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  tone?: Tone;
  /** Tabular figures so numbers do not jitter between refreshes. */
  numeric?: boolean;
};

export function AppText({ variant = 'body', tone = 'default', numeric, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[typography[variant], { color: colors[toneToColor[tone]] }, numeric && { fontVariant: ['tabular-nums'] }, style]}
    />
  );
}

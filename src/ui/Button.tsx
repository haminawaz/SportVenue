import type { ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import type { IconProps } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { useReducedMotion } from './useReducedMotion';

/**
 * primary   ink pill (cream in dark mode), the one main action in a view
 * secondary outlined pill, supporting actions
 * ghost     soft neutral fill, low emphasis
 * tertiary  text only, in-line links that need a full touch target
 * danger    destructive confirmation
 * inverse   cream-on-ink, for use on the ink surface
 * accent    court green, reserved for marketing sign-up actions on the landing page
 */
type Variant = 'primary' | 'secondary' | 'ghost' | 'tertiary' | 'danger' | 'inverse' | 'accent';
type Size = 'lg' | 'md' | 'sm';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  icon?: ComponentType<IconProps>;
  /** Icon after the label, for "continue" style buttons. */
  trailingIcon?: ComponentType<IconProps>;
  loading?: boolean;
  /** Stretch to fill the parent row. */
  block?: boolean;
};

/**
 * Compact heights: the label sets the size, not the padding. Small buttons get
 * extra hit area (hitSlop) so every button still has a 44pt+ touch target.
 */
const HEIGHT: Record<Size, number> = { lg: 50, md: 46, sm: 38 };
const PAD: Record<Size, number> = { lg: spacing.xl + 2, md: spacing.lg + 2, sm: spacing.md };

export function Button({ label, variant = 'primary', size = 'md', icon: Icon, trailingIcon: Trailing, loading, disabled, block, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const isDisabled = disabled || loading;

  const fg = {
    primary: colors.onPrimary,
    danger: colors.onAccent,
    inverse: colors.ink,
    secondary: colors.text,
    ghost: colors.text,
    tertiary: colors.accent,
    accent: colors.onAccent,
  }[variant];
  const bg = {
    primary: colors.primary,
    danger: colors.danger,
    inverse: colors.onInk,
    secondary: colors.surface,
    ghost: colors.surfaceMuted,
    tertiary: 'transparent',
    accent: colors.accent,
  }[variant];
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={isDisabled}
      aria-busy={loading}
      disabled={isDisabled}
      hitSlop={size === 'sm' ? 6 : size === 'md' ? 2 : 0}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: HEIGHT[size],
          paddingHorizontal: variant === 'tertiary' ? spacing.sm : PAD[size],
          backgroundColor: bg,
        },
        variant === 'secondary' && { borderWidth: 1.5, borderColor: colors.text },
        block && styles.block,
        pressed && (reduced ? styles.pressedFlat : styles.pressed),
        isDisabled && !loading && styles.disabled,
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="small" color={fg} /> : Icon && <Icon size={iconSize} color={fg} weight="bold" />}
        <AppText variant={size === 'sm' ? 'nav-link' : 'button'} numberOfLines={1} style={[styles.label, { color: fg }]}>
          {label}
        </AppText>
        {Trailing && !loading && <Trailing size={iconSize} color={fg} weight="bold" />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  // In a row, block buttons share the width; they also shrink so a pair never overflows.
  block: { alignSelf: 'stretch', flexGrow: 1, flexShrink: 1 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs + 2 },
  // The button style's 16pt line box is tight; a little vertical padding keeps descenders clear on Android.
  label: { paddingVertical: 2, flexShrink: 1 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  pressedFlat: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
});

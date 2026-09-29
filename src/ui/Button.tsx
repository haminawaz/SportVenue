import type { ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import type { IconProps } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, touchTarget, typography } from '@/theme/tokens';

import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
type Size = 'lg' | 'md' | 'sm';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  icon?: ComponentType<IconProps>;
  loading?: boolean;
  /** Stretch to fill the parent row. */
  block?: boolean;
};

const HEIGHT: Record<Size, number> = { lg: 56, md: touchTarget, sm: 44 };

export function Button({ label, variant = 'primary', size = 'md', icon: Icon, loading, disabled, block, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const fg =
    variant === 'primary' || variant === 'danger' ? colors.onAccent : variant === 'inverse' ? colors.accentStrong : variant === 'ghost' ? colors.accent : colors.text;
  const bg =
    variant === 'primary'
      ? colors.accent
      : variant === 'danger'
        ? colors.danger
        : variant === 'inverse'
          ? colors.heroText
          : variant === 'secondary'
            ? colors.surfaceMuted
            : 'transparent';

  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={isDisabled}
      aria-busy={loading}
      disabled={isDisabled}
      hitSlop={size === 'sm' ? 4 : 0}
      style={({ pressed }) => [
        styles.base,
        { minHeight: HEIGHT[size], paddingHorizontal: size === 'sm' ? spacing.lg : spacing.xl, backgroundColor: bg },
        variant === 'ghost' && { borderWidth: 1.5, borderColor: colors.border },
        block && styles.block,
        pressed && styles.pressed,
        isDisabled && !loading && styles.disabled,
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="small" color={fg} /> : Icon && <Icon size={size === 'sm' ? 18 : 20} color={fg} weight="bold" />}
        <AppText numberOfLines={1} style={[size === 'sm' ? typography.label : typography.bodyStrong, { color: fg }]}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  block: { alignSelf: 'stretch', flexGrow: 1 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  disabled: { opacity: 0.45 },
});

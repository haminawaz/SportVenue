import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { IconProps } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, touchTarget } from '@/theme/tokens';

import { AppText } from './AppText';
import { useSurface } from './surface';

type IconButtonProps = {
  icon: ComponentType<IconProps>;
  label: string;
  onPress: () => void;
  /** Unread count or similar. Shown as a small number badge. */
  badge?: number;
  tone?: 'default' | 'accent' | 'danger';
  variant?: 'plain' | 'filled' | 'solid';
  disabled?: boolean;
};

export function IconButton({ icon: Icon, label, onPress, badge, tone = 'default', variant = 'plain', disabled }: IconButtonProps) {
  const { colors } = useTheme();
  const surface = useSurface();
  const color = variant === 'solid' ? colors.onPrimary : tone === 'accent' ? colors.accent : tone === 'danger' ? colors.danger : colors.text;
  const spoken = badge ? `${label}, ${badge} unread` : label;
  return (
    <Pressable
      role="button"
      aria-label={spoken}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.btn,
        variant === 'filled' && [surface, styles.round],
        variant === 'solid' && [styles.round, { backgroundColor: colors.primary }],
        pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
        disabled && styles.disabled,
      ]}
    >
      <Icon size={24} color={color} weight={variant === 'solid' ? 'bold' : 'regular'} />
      {!!badge && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.background }]}>
          <AppText variant="caption-uppercase" style={{ color: colors.onAccent }} numeric>
            {badge > 99 ? '99+' : badge}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  round: { borderRadius: radius.full },
  disabled: { opacity: 0.4 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

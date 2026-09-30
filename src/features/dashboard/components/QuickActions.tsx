import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CalendarPlus, Receipt, UserPlus, type IconProps } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { useReducedMotion } from '@/ui/useReducedMotion';

type QuickActionsProps = {
  onNewBooking: () => void;
  onRecordPayment: () => void;
  onNewCustomer: () => void;
};

/** One clear main action (New booking), then the two supporting ones side by side. */
export function QuickActions({ onNewBooking, onRecordPayment, onNewCustomer }: QuickActionsProps) {
  return (
    <View style={styles.root}>
      <Button label="New booking" icon={CalendarPlus} size="lg" block onPress={onNewBooking} />
      <View style={styles.row}>
        <SecondaryAction label="Record payment" icon={Receipt} onPress={onRecordPayment} />
        <SecondaryAction label="Add customer" icon={UserPlus} onPress={onNewCustomer} />
      </View>
    </View>
  );
}

function SecondaryAction({ label, icon: Icon, onPress }: { label: string; icon: ComponentType<IconProps>; onPress: () => void }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  return (
    <Pressable
      role="button"
      aria-label={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && (reduced ? { opacity: 0.8 } : styles.pressed),
      ]}
    >
      <Icon size={22} color={colors.accent} weight="bold" />
      <AppText variant="body-strong" numberOfLines={2} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    borderRadius: radius.control,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  label: { flexShrink: 1 },
  pressed: { transform: [{ scale: 0.98 }] },
});

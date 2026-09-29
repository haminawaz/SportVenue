import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CalendarPlus, Receipt, UserPlus, type IconProps } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type Action = { key: string; label: string; icon: ComponentType<IconProps>; onPress: () => void; primary?: boolean };

type QuickActionsProps = {
  onNewBooking?: () => void;
  onRecordPayment?: () => void;
  onNewCustomer?: () => void;
};

/** The three things a front desk does most. Only permitted actions appear. */
export function QuickActions({ onNewBooking, onRecordPayment, onNewCustomer }: QuickActionsProps) {
  const { colors } = useTheme();
  const actions: Action[] = [
    onNewBooking && { key: 'booking', label: 'New booking', icon: CalendarPlus, onPress: onNewBooking, primary: true },
    onRecordPayment && { key: 'payment', label: 'Record payment', icon: Receipt, onPress: onRecordPayment },
    onNewCustomer && { key: 'customer', label: 'Add customer', icon: UserPlus, onPress: onNewCustomer },
  ].filter(Boolean) as Action[];

  if (actions.length === 0) return null;

  return (
    <View style={styles.row}>
      {actions.map(({ key, label, icon: Icon, onPress, primary }) => (
        <Pressable
          key={key}
          role="button"
          aria-label={label}
          onPress={onPress}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: primary ? colors.accent : colors.surface, borderColor: primary ? colors.accent : colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Icon size={28} color={primary ? colors.onAccent : colors.accent} weight={primary ? 'bold' : 'regular'} />
          <AppText variant="bodyStrong" numberOfLines={2} style={[styles.label, { color: primary ? colors.onAccent : colors.text }]}>
            {label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    minHeight: 112,
    borderRadius: radius.card,
    borderWidth: 1.5,
    padding: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: { lineHeight: 21 },
  pressed: { transform: [{ scale: 0.97 }] },
});

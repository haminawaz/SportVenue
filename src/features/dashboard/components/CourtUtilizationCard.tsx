import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CaretRight } from 'phosphor-react-native';

import { formatMoney, formatMoneyForA11y } from '@/lib/money';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { PressableCard } from '@/ui/Card';
import { ProgressBar } from '@/ui/ProgressBar';

import type { CourtUtilization } from '../types/facilityDashboard.types';
import { formatPercent } from '../utils/dashboardFormatters';

type CourtUtilizationCardProps = {
  court: CourtUtilization;
  currency: string;
  onPress: (courtId: string) => void;
};

export const CourtUtilizationCard = memo(function CourtUtilizationCard({ court, currency, onPress }: CourtUtilizationCardProps) {
  const { colors } = useTheme();
  const slots = `${court.bookedSlots} of ${court.totalSlots} slots booked`;

  const a11y = [
    court.name,
    court.sport,
    `${Math.round(court.utilizationPercentage)} percent utilized`,
    slots,
    court.revenue !== undefined ? `${formatMoneyForA11y(court.revenue, currency)} revenue` : undefined,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <PressableCard aria-label={a11y} accessibilityHint="Opens this court's bookings" onPress={() => onPress(court.id)}>
      <View style={styles.top}>
        <View style={styles.name}>
          <AppText variant="body-strong" numberOfLines={1}>
            {court.name}
          </AppText>
          {court.sport && (
            <AppText variant="body-sm" tone="muted" numberOfLines={1}>
              {court.sport}
            </AppText>
          )}
        </View>
        <AppText variant="title-md" numeric>
          {formatPercent(court.utilizationPercentage)}
        </AppText>
        <CaretRight size={16} color={colors.textSubtle} />
      </View>
      <View style={styles.bar}>
        <ProgressBar value={court.utilizationPercentage} />
      </View>
      <View style={styles.bottom}>
        <AppText variant="body-sm" tone="muted" numeric style={styles.flex}>
          {slots}
        </AppText>
        {court.revenue !== undefined && (
          <AppText variant="nav-link" numeric>
            {formatMoney(court.revenue, currency)}
          </AppText>
        )}
      </View>
    </PressableCard>
  );
});

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1 },
  bar: { marginTop: spacing.md, marginBottom: spacing.sm },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  flex: { flex: 1 },
});

import { StyleSheet, View } from 'react-native';
import { Bell } from 'phosphor-react-native';

import type { CalendarDate } from '@/lib/datetime';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { IconButton } from '@/ui/IconButton';

import type { DateRange } from '../types/facilityDashboard.types';

import { DateRangeSelector } from './DateRangeSelector';

type DashboardHeaderProps = {
  greeting: string;
  facilityName: string;
  range: DateRange;
  today: CalendarDate;
  onRangeChange: (range: DateRange) => void;
  unread?: number;
  onNotifications?: () => void;
};

export function DashboardHeader({ greeting, facilityName, range, today, onRangeChange, unread, onNotifications }: DashboardHeaderProps) {
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.titles}>
          <AppText variant="bodyStrong" tone="muted">
            {greeting}
          </AppText>
          <AppText variant="display" role="heading" numberOfLines={2}>
            {facilityName}
          </AppText>
        </View>
        {onNotifications && <IconButton icon={Bell} label="Notifications" badge={unread} onPress={onNotifications} variant="filled" />}
      </View>
      <DateRangeSelector value={range} today={today} onChange={onRangeChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xl },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titles: { flex: 1, gap: spacing.xxs },
});

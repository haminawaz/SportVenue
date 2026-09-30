import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Skeleton } from '@/ui/Skeleton';

/** Mirrors the loaded layout (summary card, main action, two supporting actions) so nothing jumps. */
export function DashboardSkeleton() {
  const { colors } = useTheme();

  return (
    <View accessible role="progressbar" aria-label="Loading dashboard" aria-busy style={styles.root}>
      <View style={[styles.hero, { backgroundColor: colors.surfaceMuted }]}>
        <Skeleton width="40%" height={20} />
        <Skeleton width="70%" height={48} />
        <Skeleton width={160} height={30} radius={radius.full} />
        <View style={styles.split}>
          <View style={styles.flex}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="50%" height={30} />
          </View>
          <View style={styles.flex}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="50%" height={30} />
          </View>
        </View>
        <Skeleton height={68} radius={radius.control} />
      </View>
      <Skeleton height={56} radius={radius.control} />
      <View style={styles.row}>
        {[0, 1].map((i) => (
          <Skeleton key={i} height={60} radius={radius.control} style={styles.flex} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  hero: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.md, marginBottom: spacing.xl },
  split: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  flex: { flex: 1, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
});

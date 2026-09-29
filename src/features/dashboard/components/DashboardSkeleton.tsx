import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Skeleton } from '@/ui/Skeleton';
import { useSurface } from '@/ui/surface';

/** Mirrors the loaded layout (hero, owed card, quick actions, a section) so nothing jumps. */
export function DashboardSkeleton() {
  const { colors } = useTheme();
  const surface = useSurface();

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
      </View>
      <View style={[surface, styles.card]}>
        <Skeleton width={48} height={48} radius={radius.full} />
        <View style={styles.flex}>
          <Skeleton width="40%" height={16} />
          <Skeleton width="60%" height={30} />
        </View>
      </View>
      <View style={styles.row}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={112} radius={radius.card} style={styles.flex} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  hero: { borderRadius: radius.card, padding: spacing.xxl, gap: spacing.md },
  split: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  flex: { flex: 1, gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.xl },
  row: { flexDirection: 'row', gap: spacing.sm },
});

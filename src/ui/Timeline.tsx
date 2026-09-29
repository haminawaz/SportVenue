import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { useSurface } from './surface';

export type TimelineItem = { id: string; title: string; meta: string };

/** Vertical history list. The rail connects events; text carries the meaning. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <View role="list" style={[surface, styles.card]}>
      {items.map((item, i) => (
        <View key={item.id} role="listitem" accessible aria-label={`${item.title}, ${item.meta}`} style={styles.row}>
          <View style={styles.railCol}>
            <View style={[styles.node, { borderColor: i === 0 ? colors.accent : colors.border, backgroundColor: i === 0 ? colors.accentSoft : colors.surface }]} />
            {i < items.length - 1 && <View style={[styles.rail, { backgroundColor: colors.border }]} />}
          </View>
          <View style={[styles.text, i === items.length - 1 && styles.lastText]}>
            <AppText variant="bodyStrong">{item.title}</AppText>
            <AppText variant="caption" tone="muted">
              {item.meta}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.xl },
  row: { flexDirection: 'row', gap: spacing.lg },
  railCol: { width: 16, alignItems: 'center' },
  node: { width: 16, height: 16, borderRadius: radius.full, borderWidth: 3, marginTop: 4 },
  rail: { width: 2, flex: 1, marginVertical: 3 },
  text: { flex: 1, paddingBottom: spacing.xl, gap: spacing.xxs },
  lastText: { paddingBottom: 0 },
});

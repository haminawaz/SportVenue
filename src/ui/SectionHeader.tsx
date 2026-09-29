import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CaretRight } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type SectionHeaderProps = {
  title: string;
  count?: number;
  action?: ReactNode;
  /** Text link on the right, for example "See all". */
  linkLabel?: string;
  onLink?: () => void;
};

export function SectionHeader({ title, count, action, linkLabel = 'See all', onLink }: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        <AppText variant="heading" role="heading" numberOfLines={2} style={styles.title}>
          {title}
        </AppText>
        {count !== undefined && count > 0 && (
          <View style={[styles.count, { backgroundColor: colors.surfaceMuted }]}>
            <AppText variant="badge" tone="muted" numeric>
              {count}
            </AppText>
          </View>
        )}
      </View>
      {action}
      {onLink && (
        <Pressable role="link" aria-label={`${linkLabel}: ${title}`} onPress={onLink} hitSlop={12} style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}>
          <AppText variant="label" tone="accent">
            {linkLabel}
          </AppText>
          <CaretRight size={14} color={colors.accent} weight="bold" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  title: { flexShrink: 1 },
  count: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, minWidth: 26, alignItems: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 36 },
});

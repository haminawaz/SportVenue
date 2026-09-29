import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

export type BadgeTone = 'positive' | 'warning' | 'danger' | 'neutral';

/** Text is always the primary signal; colour only reinforces it. */
export function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  const { colors } = useTheme();
  const map = {
    positive: { bg: colors.accentSoft, fg: colors.accent },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    neutral: { bg: colors.surfaceMuted, fg: colors.textMuted },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <AppText variant="badge" style={{ color: map.fg }} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.badge, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, alignSelf: 'flex-start' },
});

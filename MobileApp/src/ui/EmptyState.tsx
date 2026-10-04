import type { ComponentType, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { IconProps } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { useSurface } from './surface';

type EmptyStateProps = {
  icon: ComponentType<IconProps>;
  title: string;
  message?: string;
  action?: ReactNode;
  /** Compact renders inline inside a section instead of as a full block. */
  compact?: boolean;
};

export function EmptyState({ icon: Icon, title, message, action, compact }: EmptyStateProps) {
  const { colors } = useTheme();
  const surface = useSurface();

  if (compact) {
    return (
      <View style={[styles.compact, { borderColor: colors.border }]}>
        <View style={[styles.iconSmall, { backgroundColor: colors.surfaceMuted }]}>
          <Icon size={22} color={colors.textMuted} />
        </View>
        <View style={styles.flex}>
          <AppText variant="body-strong">{title}</AppText>
          {message && (
            <AppText variant="body-sm" tone="muted">
              {message}
            </AppText>
          )}
          {action && <View style={styles.actionCompact}>{action}</View>}
        </View>
      </View>
    );
  }

  return (
    <View style={[surface, styles.full]}>
      <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
        <Icon size={30} color={colors.accent} />
      </View>
      <AppText variant="title-md" style={styles.center}>
        {title}
      </AppText>
      {message && (
        <AppText tone="muted" style={styles.center}>
          {message}
        </AppText>
      )}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  full: { padding: spacing.xxxl, alignItems: 'center', gap: spacing.sm },
  icon: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  center: { textAlign: 'center' },
  action: { marginTop: spacing.lg },
  compact: { borderRadius: radius.card, borderWidth: 1.5, borderStyle: 'dashed', padding: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  iconSmall: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: spacing.xxs },
  actionCompact: { marginTop: spacing.md },
});

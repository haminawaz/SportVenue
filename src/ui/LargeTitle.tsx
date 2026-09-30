import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';

import { AppText } from './AppText';

/** Title block for tab screens (which have no native header). */
export function LargeTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        {subtitle && (
          <AppText variant="nav-link" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
        <AppText variant="display-xl" role="heading" numberOfLines={2}>
          {title}
        </AppText>
      </View>
      {actions && <View style={styles.actions}>{actions}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.xs },
  text: { flex: 1, gap: spacing.xs },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

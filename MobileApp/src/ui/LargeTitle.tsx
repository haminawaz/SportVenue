import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrowLeft } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { GUTTER } from './surface';

/** Readable measure on tablets and web; phones use the full width. Matches Screen. */
const MAX_CONTENT = 720;

/** Title block for tab screens (which have no native header). */
export function LargeTitle({ title, subtitle, actions, onBack }: { title: string; subtitle?: string; actions?: ReactNode; onBack?: () => void }) {
  return (
    <View style={styles.row}>
      {onBack && <IconButton icon={ArrowLeft} label="Back" onPress={onBack} variant="filled" size="sm" />}
      <View style={styles.text}>
        {subtitle && (
          <AppText variant="nav-link" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
        <AppText variant="display-xl" role="heading" numberOfLines={1}>
          {title}
        </AppText>
      </View>
      {actions && <View style={styles.actions}>{actions}</View>}
    </View>
  );
}

type PinnedTitleProps = {
  title: string;
  actions?: ReactNode;
  /** Pushed screens with a pinned title show a back button before it. */
  onBack?: () => void;
  /** True once the content has scrolled under the title. */
  scrolled: boolean;
};

/**
 * The large title, pinned above a tab screen's scrolling content. It keeps the
 * page background so content slides underneath, and shows a hairline once the
 * content has scrolled.
 */
export function PinnedTitle({ title, actions, onBack, scrolled }: PinnedTitleProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.pinned,
        {
          paddingTop: insets.top + spacing.sm,
          paddingLeft: insets.left + GUTTER,
          paddingRight: insets.right + GUTTER,
          backgroundColor: colors.background,
          borderBottomColor: scrolled ? colors.border : 'transparent',
        },
      ]}
    >
      <View style={styles.pinnedInner}>
        <LargeTitle title={title} actions={actions} onBack={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  text: { flex: 1, gap: spacing.xs },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pinned: { paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  pinnedInner: { width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center' },
});

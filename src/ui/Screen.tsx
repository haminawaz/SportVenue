import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

import { PinnedTitle } from './LargeTitle';
import { GUTTER } from './surface';

export { GUTTER };

/** Readable measure on tablets and web; phones use the full width. */
export const MAX_CONTENT = 720;

type ScreenProps = {
  children: ReactNode;
  /** Pull-to-refresh. Keeps content on screen while refreshing. */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Sticky bottom bar (form submit, primary actions). */
  footer?: ReactNode;
  /** Adds the top safe-area inset (tab screens without a native header). */
  topInset?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Forms: lift content above the keyboard. */
  keyboard?: boolean;
  /** Tab screens: a large title pinned above the scrolling content (handles the top inset). */
  title?: string;
  titleActions?: ReactNode;
  /** Pushed screens using a pinned title (and no native header). */
  onBack?: () => void;
};

export function Screen({ children, refreshing = false, onRefresh, footer, topInset, contentStyle, keyboard, title, titleActions, onBack }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [scrolled, setScrolled] = useState(false);

  const scroll = (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: (topInset && !title ? insets.top : 0) + (title ? spacing.sm : spacing.lg),
          paddingBottom: footer ? spacing.xxl : insets.bottom + spacing.huge,
          paddingLeft: insets.left + GUTTER,
          paddingRight: insets.right + GUTTER,
        },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScroll={title ? (e) => setScrolled(e.nativeEvent.contentOffset.y > 2) : undefined}
      scrollEventThrottle={title ? 32 : undefined}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} progressBackgroundColor={colors.surface} />
        ) : undefined
      }
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );

  const body = (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {title && <PinnedTitle title={title} actions={titleActions} onBack={onBack} scrolled={scrolled} />}
      {scroll}
      {footer && <StickyFooter>{footer}</StickyFooter>}
    </View>
  );

  if (!keyboard) return body;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}>
      {body}
    </KeyboardAvoidingView>
  );
}

export function StickyFooter({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
          paddingLeft: insets.left + GUTTER,
          paddingRight: insets.right + GUTTER,
        },
      ]}
    >
      <View style={[styles.inner, styles.footerRow]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  inner: { width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center', gap: spacing.xxxl },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
});

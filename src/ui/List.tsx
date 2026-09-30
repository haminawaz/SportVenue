import { Children, Fragment, isValidElement, type ComponentType, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CaretRight, type IconProps } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { useSurface } from './surface';

/** Grouped rows on one elevated surface, separated by inset hairlines. */
export function ListGroup({ children, title, footer }: { children: ReactNode; title?: string; footer?: string }) {
  const { colors } = useTheme();
  const surface = useSurface();
  const items = Children.toArray(children).filter(isValidElement);
  if (items.length === 0) return null;
  return (
    <View style={styles.groupWrap}>
      {title && (
        <AppText variant="display-sm" style={styles.groupTitle} role="heading">
          {title}
        </AppText>
      )}
      {/* Outer view carries the shadow; the inner one clips pressed-row backgrounds to the corners (iOS clips shadows on overflow: hidden). */}
      <View style={surface}>
        <View style={styles.group}>
          {items.map((child, i) => (
            <Fragment key={child.key ?? i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              {child}
            </Fragment>
          ))}
        </View>
      </View>
      {footer && (
        <AppText variant="body-sm" tone="muted" style={styles.groupFooter}>
          {footer}
        </AppText>
      )}
    </View>
  );
}

type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Right-aligned value text. */
  value?: string;
  valueTone?: 'default' | 'muted' | 'warning' | 'danger' | 'accent';
  icon?: ComponentType<IconProps>;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  /** Screen-reader label; defaults to title, subtitle and value. */
  label?: string;
  hint?: string;
  titleLines?: number;
  disabled?: boolean;
};

export function ListRow({ title, subtitle, value, valueTone = 'muted', icon: Icon, leading, trailing, onPress, destructive, label, hint, titleLines = 2, disabled }: ListRowProps) {
  const { colors } = useTheme();
  const a11y = label ?? [title, subtitle, value].filter(Boolean).join(', ');

  const content = (
    <>
      {leading}
      {Icon && !leading && (
        <View style={[styles.icon, { backgroundColor: destructive ? colors.dangerSoft : colors.surfaceMuted }]}>
          <Icon size={22} color={destructive ? colors.danger : colors.text} />
        </View>
      )}
      <View style={styles.text}>
        <AppText variant="body-strong" numberOfLines={titleLines} style={destructive ? { color: colors.danger } : undefined}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body-sm" tone="muted" numberOfLines={4}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value !== undefined && (
        <AppText variant="body-md" tone={valueTone} numeric numberOfLines={2} style={styles.value}>
          {value}
        </AppText>
      )}
      {trailing}
      {onPress && !destructive && <CaretRight size={18} color={colors.textSubtle} weight="bold" style={styles.caret} />}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.row} accessible aria-label={a11y}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      role="button"
      aria-label={a11y}
      accessibilityHint={hint}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }, disabled && { opacity: 0.5 }]}
    >
      {content}
    </Pressable>
  );
}

type SummaryRowProps = {
  title: string;
  /** Right side of the first line, usually an amount. */
  value?: string;
  valueTone?: 'default' | 'muted' | 'warning' | 'danger' | 'accent';
  /** One line of detail under the title. Keep it to one separator. */
  meta?: string;
  /** Right side of the second line: at most one status tag. */
  tag?: ReactNode;
  leading?: ReactNode;
  onPress: () => void;
  /** Screen-reader label for the whole row. */
  label: string;
  hint?: string;
};

/**
 * Two-line list row for dense lists (customers, balances, payments):
 * who and how much, then one line of detail and at most one tag. Nothing
 * wraps, so every row has the same rhythm.
 */
export function SummaryRow({ title, value, valueTone = 'default', meta, tag, leading, onPress, label, hint }: SummaryRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      role="button"
      aria-label={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.summary, pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      {leading}
      <View style={styles.summaryMain}>
        <View style={styles.summaryLine}>
          <AppText variant="body-strong" numberOfLines={1} style={styles.summaryTitle}>
            {title}
          </AppText>
          {value !== undefined && (
            <AppText variant="body-strong" tone={valueTone} numeric numberOfLines={1}>
              {value}
            </AppText>
          )}
        </View>
        {(meta || tag) && (
          <View style={styles.summaryLine}>
            <AppText variant="body-sm" tone="muted" numeric numberOfLines={1} style={styles.summaryTitle}>
              {meta}
            </AppText>
            {tag}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  groupWrap: { gap: spacing.md },
  groupTitle: { paddingHorizontal: spacing.xxs },
  groupFooter: { paddingHorizontal: spacing.xs },
  group: { overflow: 'hidden', borderRadius: radius.card },
  divider: { height: StyleSheet.hairlineWidth * 2, marginLeft: spacing.xl },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  icon: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: spacing.xs + 2 },
  value: { maxWidth: '48%', textAlign: 'right' },
  caret: { marginLeft: -spacing.xs },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md + 2, minHeight: 72 },
  summaryMain: { flex: 1, gap: spacing.xs },
  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryTitle: { flex: 1 },
});

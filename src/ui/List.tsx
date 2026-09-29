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
        <AppText variant="heading" style={styles.groupTitle} role="heading">
          {title}
        </AppText>
      )}
      <View style={[surface, styles.group]}>
        {items.map((child, i) => (
          <Fragment key={child.key ?? i}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            {child}
          </Fragment>
        ))}
      </View>
      {footer && (
        <AppText variant="caption" tone="muted" style={styles.groupFooter}>
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
        <View style={[styles.icon, { backgroundColor: destructive ? colors.dangerSoft : colors.accentSoft }]}>
          <Icon size={22} color={destructive ? colors.danger : colors.accent} />
        </View>
      )}
      <View style={styles.text}>
        <AppText variant="bodyStrong" numberOfLines={titleLines} style={destructive ? { color: colors.danger } : undefined}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={4}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value !== undefined && (
        <AppText variant="body" tone={valueTone} numeric numberOfLines={2} style={styles.value}>
          {value}
        </AppText>
      )}
      {trailing}
      {onPress && !destructive && <CaretRight size={18} color={colors.textSubtle} weight="bold" />}
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

const styles = StyleSheet.create({
  groupWrap: { gap: spacing.md },
  groupTitle: { paddingHorizontal: spacing.xxs },
  groupFooter: { paddingHorizontal: spacing.xs },
  group: { overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.xl },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  icon: { width: 42, height: 42, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: spacing.xxs + 1 },
  value: { maxWidth: '48%', textAlign: 'right' },
});

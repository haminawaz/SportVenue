import { StyleSheet, View } from 'react-native';

import type { BookingQuote } from '@/domain/types';
import { useFormat } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Skeleton } from '@/ui/Skeleton';

type QuoteSummaryProps = { quote?: BookingQuote; loading?: boolean; previousTotal?: number; error?: boolean };

/** Server-priced breakdown. The app never adds these numbers up itself. */
export function QuoteSummary({ quote, loading, previousTotal, error }: QuoteSummaryProps) {
  const { colors } = useTheme();
  const f = useFormat();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} aria-live="polite">
      <AppText variant="label" tone="muted">
        Price
      </AppText>
      {error ? (
        <AppText tone="danger">Couldn’t price this slot. Choose it again.</AppText>
      ) : !quote ? (
        loading ? (
          <View style={styles.lines} accessible role="progressbar" aria-label="Calculating price">
            <Skeleton width="80%" height={14} />
            <Skeleton width="40%" height={22} />
          </View>
        ) : (
          <AppText tone="muted">Choose a time to see the price.</AppText>
        )
      ) : (
        <View style={[styles.lines, loading && { opacity: 0.5 }]}>
          {quote.breakdown.map((l) => (
            <View key={l.label} style={styles.line}>
              <AppText tone="muted" style={styles.flex}>
                {l.label}
              </AppText>
              <AppText numeric tone={l.amount < 0 ? 'accent' : 'default'}>
                {l.amount < 0 ? `-${f.money(-l.amount)}` : f.money(l.amount)}
              </AppText>
            </View>
          ))}
          <View style={[styles.line, styles.total, { borderTopColor: colors.border }]}>
            <AppText variant="bodyStrong" style={styles.flex}>
              Total
            </AppText>
            <AppText variant="heading" numeric aria-label={`Total ${f.moneyA11y(quote.total)}`}>
              {f.money(quote.total)}
            </AppText>
          </View>
          {previousTotal !== undefined && previousTotal !== quote.total && (
            <AppText variant="caption" tone="muted">
              Was {f.money(previousTotal)}. {quote.total > previousTotal ? `The customer will owe ${f.money(quote.total - previousTotal)} more.` : `The price drops by ${f.money(previousTotal - quote.total)}.`}
            </AppText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg, gap: spacing.sm },
  lines: { gap: spacing.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  total: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm, marginTop: spacing.xs },
  flex: { flex: 1 },
});

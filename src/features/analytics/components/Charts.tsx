import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

/**
 * Chart primitives. Single-series marks use the accent hue only; magnitude
 * scales are one hue, light to dark. Values are read by tapping a mark
 * (the touch equivalent of hover), and every chart exposes a text alternative.
 */

type ColumnDatum = { key: string; label: string; value: number; valueLabel: string; axisLabel?: string };

/** Vertical bars over time (for example revenue per day). Tap a bar to read it. */
export function ColumnChart({ data, summary, height = 160 }: { data: ColumnDatum[]; summary: { label: string; value: string }; height?: number }) {
  const { colors } = useTheme();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const dense = data.length > 20;
  const shown = active !== null ? data[active] : null;

  return (
    <View>
      <View style={styles.readout} aria-live="polite">
        <AppText variant="caption" tone="muted">
          {shown ? shown.label : summary.label}
        </AppText>
        <AppText variant="heading" numeric>
          {shown ? shown.valueLabel : summary.value}
        </AppText>
      </View>
      <View style={[styles.columns, { height, borderBottomColor: colors.border }]}>
        {/* recessive gridline at the top value */}
        <View style={[styles.gridline, { top: 0, borderTopColor: colors.border }]} />
        {data.map((d, i) => {
          const h = d.value <= 0 ? 0 : Math.max(3, (d.value / max) * (height - 8));
          const on = active === i;
          return (
            <Pressable
              key={d.key}
              role="button"
              aria-label={`${d.label}: ${d.valueLabel}`}
              onPress={() => setActive(on ? null : i)}
              style={styles.colHit}
              hitSlop={{ top: 8, bottom: 8 }}
            >
              <View
                style={{
                  height: h,
                  marginHorizontal: dense ? 1.5 : 3,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  backgroundColor: colors.accent,
                  opacity: active === null || on ? 1 : 0.35,
                }}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.axis}>
        {/* Each label spans a group of bars, so dates are never squeezed into one bar's width. */}
        {axisGroups(data).map((g) => (
          <View key={g.key} style={{ flex: g.span }}>
            <AppText variant="badge" tone="muted" numberOfLines={1}>
              {g.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function axisGroups(data: ColumnDatum[]) {
  const step = data.length > 14 ? Math.ceil(data.length / 5) : data.length > 7 ? 2 : 1;
  const out: { key: string; label: string; span: number }[] = [];
  for (let i = 0; i < data.length; i += step) out.push({ key: data[i].key, label: data[i].axisLabel ?? '', span: Math.min(step, data.length - i) });
  return out;
}

type BarDatum = { key: string; label: string; value: number; valueLabel: string; onPress?: () => void };

/** Ranked horizontal bars with direct value labels (no legend needed). */
export function BarList({ data, max: fixedMax }: { data: BarDatum[]; max?: number }) {
  const { colors } = useTheme();
  const max = fixedMax ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={styles.bars} role="list">
      {data.map((d) => (
        <Pressable
          key={d.key}
          role={d.onPress ? 'button' : 'listitem'}
          aria-label={`${d.label}: ${d.valueLabel}`}
          disabled={!d.onPress}
          onPress={d.onPress}
          style={({ pressed }) => [styles.barRow, pressed && { opacity: 0.7 }]}
        >
          <View style={styles.barHead}>
            <AppText variant="label" numberOfLines={1} style={styles.flex}>
              {d.label}
            </AppText>
            <AppText variant="label" numeric tone="muted">
              {d.valueLabel}
            </AppText>
          </View>
          <View style={styles.barTrack}>
            <View
              style={{
                width: `${Math.max(d.value > 0 ? 2 : 0, (d.value / max) * 100)}%`,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.accent,
              }}
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

type HeatCell = { row: number; col: number; value: number };

/**
 * Weekday x hour heatmap on a single-hue sequential ramp.
 * Tap a cell to read its exact value.
 */
export function Heatmap({
  cells,
  rows,
  cols,
  rowLabel,
  colLabel,
  colShort = colLabel,
  valueLabel,
}: {
  cells: HeatCell[];
  rows: number[];
  cols: number[];
  rowLabel: (r: number) => string;
  colLabel: (c: number) => string;
  /** Compact axis label; defaults to colLabel. */
  colShort?: (c: number) => string;
  valueLabel: (v: number) => string;
}) {
  const { colors } = useTheme();
  const [active, setActive] = useState<HeatCell | null>(null);
  const lookup = new Map(cells.map((c) => [`${c.row}:${c.col}`, c]));
  const steps = [0.08, 0.22, 0.4, 0.6, 0.8, 1];
  const step = (v: number) => steps[Math.min(steps.length - 1, Math.floor((v / 100) * steps.length))];

  return (
    <View>
      <View style={styles.readout} aria-live="polite">
        <AppText variant="caption" tone="muted">
          {active ? `${rowLabel(active.row)}, ${colLabel(active.col)}` : 'Tap a square to see how busy it is'}
        </AppText>
        {active && (
          <AppText variant="heading" numeric>
            {valueLabel(active.value)}
          </AppText>
        )}
      </View>
      <View style={styles.heat}>
        {rows.map((r) => (
          <View key={r} style={styles.heatRow}>
            <AppText variant="badge" tone="muted" style={styles.heatRowLabel}>
              {rowLabel(r)}
            </AppText>
            {cols.map((c) => {
              const cell = lookup.get(`${r}:${c}`) ?? { row: r, col: c, value: 0 };
              const on = active?.row === r && active?.col === c;
              return (
                <Pressable
                  key={c}
                  role="button"
                  aria-label={`${rowLabel(r)} ${colLabel(c)}: ${valueLabel(cell.value)}`}
                  onPress={() => setActive(on ? null : cell)}
                  style={[styles.heatCell, { borderColor: on ? colors.text : 'transparent' }]}
                >
                  <View style={[StyleSheet.absoluteFill, styles.heatFill, { backgroundColor: colors.surfaceMuted }]} />
                  <View style={[StyleSheet.absoluteFill, styles.heatFill, { backgroundColor: colors.accent, opacity: step(cell.value) }]} />
                </Pressable>
              );
            })}
          </View>
        ))}
        <View style={styles.heatRow}>
          <View style={styles.heatRowLabel} />
          {cols.map((c, i) => (
            <View key={c} style={styles.heatColLabel}>
              {i % 3 === 0 && (
                <AppText variant="badge" tone="subtle" numberOfLines={1} style={styles.heatAxisText}>
                  {colShort(c)}
                </AppText>
              )}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.key} accessible aria-label="Colour key: lighter is quieter, darker is busier">
        <AppText variant="caption" tone="muted">
          Quiet
        </AppText>
        {steps.map((o) => (
          <View key={o} style={[styles.keyCell, { backgroundColor: colors.surfaceMuted }]}>
            <View style={[StyleSheet.absoluteFill, styles.heatFill, { backgroundColor: colors.accent, opacity: o }]} />
          </View>
        ))}
        <AppText variant="caption" tone="muted">
          Busy
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { minHeight: 44, marginBottom: spacing.md },
  columns: { flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: StyleSheet.hairlineWidth },
  gridline: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed' },
  colHit: { flex: 1, justifyContent: 'flex-end', height: '100%' },
  axis: { flexDirection: 'row', marginTop: spacing.xs },
  bars: { gap: spacing.md },
  barRow: { gap: spacing.xs + 2 },
  barHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barTrack: { height: 8 },
  flex: { flex: 1 },
  heat: { gap: 2 },
  heatRow: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  heatRowLabel: { width: 32 },
  heatCell: { flex: 1, aspectRatio: 1, borderRadius: 3, borderWidth: 1.5 },
  heatFill: { borderRadius: 3 },
  heatColLabel: { flex: 1, overflow: 'visible' },
  heatAxisText: { width: 40 },
  key: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md, alignSelf: 'flex-end' },
  keyCell: { width: 14, height: 14, borderRadius: radius.badge / 2 },
});

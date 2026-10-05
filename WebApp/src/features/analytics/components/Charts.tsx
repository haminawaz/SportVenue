'use client';

import { useState } from 'react';

import { AppText } from '@/ui/AppText';
import { cn } from '@/ui/cn';

/**
 * Chart primitives. Single-series marks use the accent hue only; magnitude
 * scales are one hue, light to dark. Values are read by hovering or tapping a
 * mark, and every chart exposes a text alternative.
 */

type ColumnDatum = { key: string; label: string; value: number; valueLabel: string; axisLabel?: string };

/** Vertical bars over time (for example revenue per day). Hover or tap a bar to read it. */
export function ColumnChart({ data, summary, height = 160 }: { data: ColumnDatum[]; summary: { label: string; value: string }; height?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const dense = data.length > 20;
  const focus = hover ?? active;
  const shown = focus !== null ? data[focus] : null;

  return (
    <div>
      <div aria-live="polite" className="mb-3 min-h-11">
        <AppText variant="small" tone="muted">
          {shown ? shown.label : summary.label}
        </AppText>
        <AppText variant="stat" numeric>
          {shown ? shown.valueLabel : summary.value}
        </AppText>
      </div>
      <div className="relative flex items-end border-b border-border" style={{ height }} onMouseLeave={() => setHover(null)}>
        {/* recessive gridline at the top value */}
        <span aria-hidden className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
        {data.map((d, i) => {
          const h = d.value <= 0 ? 0 : Math.max(3, (d.value / max) * (height - 8));
          const on = focus === i;
          return (
            <button
              key={d.key}
              type="button"
              aria-label={`${d.label}: ${d.valueLabel}`}
              aria-pressed={active === i}
              onClick={() => setActive(active === i ? null : i)}
              onMouseEnter={() => setHover(i)}
              className="flex h-full min-w-0 flex-1 flex-col justify-end"
            >
              <span
                aria-hidden
                className={cn('block rounded-t bg-accent transition-opacity', dense ? 'mx-[1.5px]' : 'mx-[3px]')}
                style={{ height: h, opacity: focus === null || on ? 1 : 0.35 }}
              />
            </button>
          );
        })}
      </div>
      <div aria-hidden className="mt-1 flex">
        {/* Each label spans a group of bars, so dates are never squeezed into one bar's width. */}
        {axisGroups(data).map((g) => (
          <div key={g.key} className="min-w-0" style={{ flex: g.span }}>
            <AppText variant="mini" tone="muted" lines={1}>
              {g.label}
            </AppText>
          </div>
        ))}
      </div>
    </div>
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
  const max = fixedMax ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="flex flex-col gap-3">
      {data.map((d) => {
        const content = (
          <>
            <span className="flex items-center gap-3">
              <AppText variant="label" lines={1} className="flex-1">
                {d.label}
              </AppText>
              <AppText variant="label" numeric tone="muted">
                {d.valueLabel}
              </AppText>
            </span>
            <span aria-hidden className="block h-2">
              <span className="block h-2 rounded bg-accent" style={{ width: `${Math.max(d.value > 0 ? 2 : 0, (d.value / max) * 100)}%` }} />
            </span>
          </>
        );
        return (
          <li key={d.key} aria-label={d.onPress ? undefined : `${d.label}: ${d.valueLabel}`}>
            {d.onPress ? (
              <button type="button" aria-label={`${d.label}: ${d.valueLabel}`} onClick={d.onPress} className="flex w-full flex-col gap-1.5 text-left transition-opacity hover:opacity-80 active:opacity-70">
                {content}
              </button>
            ) : (
              <div className="flex flex-col gap-1.5">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

type HeatCell = { row: number; col: number; value: number };

const STEPS = [0.08, 0.22, 0.4, 0.6, 0.8, 1];

/**
 * Weekday x hour heatmap on a single-hue sequential ramp.
 * Hover or tap a cell to read its exact value.
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
  const [active, setActive] = useState<HeatCell | null>(null);
  const [hover, setHover] = useState<HeatCell | null>(null);
  const lookup = new Map(cells.map((c) => [`${c.row}:${c.col}`, c]));
  const step = (v: number) => STEPS[Math.min(STEPS.length - 1, Math.floor((v / 100) * STEPS.length))];
  const shown = hover ?? active;

  return (
    <div>
      <div aria-live="polite" className="mb-3 min-h-11">
        <AppText variant="small" tone="muted">
          {shown ? `${rowLabel(shown.row)}, ${colLabel(shown.col)}` : 'Hover over or select a square to see how busy it is'}
        </AppText>
        {shown && (
          <AppText variant="stat" numeric>
            {valueLabel(shown.value)}
          </AppText>
        )}
      </div>
      <div className="flex flex-col gap-0.5" onMouseLeave={() => setHover(null)}>
        {rows.map((r) => (
          <div key={r} className="flex items-center gap-0.5">
            <AppText variant="mini" tone="muted" className="w-8 shrink-0">
              {rowLabel(r)}
            </AppText>
            {cols.map((c) => {
              const cell = lookup.get(`${r}:${c}`) ?? { row: r, col: c, value: 0 };
              const on = shown?.row === r && shown?.col === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={`${rowLabel(r)} ${colLabel(c)}: ${valueLabel(cell.value)}`}
                  aria-pressed={active?.row === r && active?.col === c}
                  onClick={() => setActive(active?.row === r && active?.col === c ? null : cell)}
                  onMouseEnter={() => setHover(cell)}
                  className={cn('relative aspect-square min-w-0 flex-1 rounded-[3px] border-[1.5px] bg-surface-muted', on ? 'border-text' : 'border-transparent')}
                >
                  <span aria-hidden className="absolute inset-0 rounded-[2px] bg-accent" style={{ opacity: step(cell.value) }} />
                </button>
              );
            })}
          </div>
        ))}
        <div aria-hidden className="flex items-center gap-0.5">
          <span className="w-8 shrink-0" />
          {cols.map((c, i) => (
            <div key={c} className="min-w-0 flex-1 overflow-visible">
              {i % 3 === 0 && (
                <AppText variant="mini" tone="subtle" className="w-10 whitespace-nowrap">
                  {colShort(c)}
                </AppText>
              )}
            </div>
          ))}
        </div>
      </div>
      <div role="img" aria-label="Colour key: lighter is quieter, darker is busier" className="mt-3 flex items-center justify-end gap-1">
        <AppText variant="small" tone="muted">
          Quiet
        </AppText>
        {STEPS.map((o) => (
          <span key={o} className="relative h-3.5 w-3.5 rounded-[3px] bg-surface-muted">
            <span className="absolute inset-0 rounded-[3px] bg-accent" style={{ opacity: o }} />
          </span>
        ))}
        <AppText variant="small" tone="muted">
          Busy
        </AppText>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from '@phosphor-icons/react';

import { AppText } from './AppText';
import { cn } from './cn';
import type { IconType } from './icon';
import { surfaceClass } from './surface';

export type MetricTrend = { direction: 'up' | 'down' | 'flat'; text: string; a11y: string };

export type MetricCardProps = {
  label: string;
  value: string;
  /** Spoken value when it differs from the visual one (currency names, "percent"). */
  valueA11y?: string;
  trend?: MetricTrend | null;
  /** Whether "up" is good news. False for things like cancellations. */
  upIsGood?: boolean;
  supporting?: string;
  icon?: IconType;
  tint?: 'surface' | 'accent' | 'warning';
  /** Tiles sit in a two-column grid; "full" spans both columns. */
  span?: 'half' | 'full';
};

/** Generic KPI tile. Holds no business logic; callers pass formatted values. */
export function MetricCard({ label, value, valueA11y, trend, upIsGood = true, supporting, icon: Icon, tint = 'surface', span = 'half' }: MetricCardProps) {
  const TrendIcon = trend?.direction === 'up' ? ArrowUpRight : trend?.direction === 'down' ? ArrowDownRight : Minus;
  const good = trend && trend.direction !== 'flat' && (trend.direction === 'up') === upIsGood;
  const trendColor = !trend || trend.direction === 'flat' ? 'text-text-muted' : good ? 'text-accent' : 'text-danger';
  const a11yLabel = [label, valueA11y ?? value, trend?.a11y, supporting].filter(Boolean).join(', ');

  return (
    <div className={cn(surfaceClass(tint), 'min-w-0 p-[18px] [container-type:inline-size]', span === 'full' && 'col-span-2')}>
      <div role="group" aria-label={a11yLabel} className="flex flex-col gap-1.5">
        {Icon && (
          <span
            aria-hidden
            className={cn('mb-1 flex h-[38px] w-[38px] items-center justify-center rounded-full', tint === 'surface' ? 'bg-accent-soft' : 'bg-surface', tint === 'warning' ? 'text-warning' : 'text-accent')}
          >
            <Icon size={20} weight="bold" />
          </span>
        )}
        <AppText variant="nav-link" tone="muted" lines={2} aria-hidden>
          {label}
        </AppText>
        {/* Shrinks long values to fit narrow tiles, sized from the text length and the tile's width. */}
        <AppText
          variant="display-lg"
          numeric
          lines={1}
          aria-hidden
          style={{ fontSize: `clamp(18px, calc(100cqi / ${Math.max(1, value.length * 0.62).toFixed(2)}), 28px)`, lineHeight: 1.2 }}
        >
          {value}
        </AppText>
        {trend && (
          <span aria-hidden className={cn('flex items-start gap-1', trendColor)}>
            <TrendIcon size={16} weight="bold" className="mt-0.5 shrink-0" />
            <AppText variant="nav-link" numeric lines={2} className="text-current">
              {trend.text}
            </AppText>
          </span>
        )}
        {supporting && (
          <AppText variant="body-sm" tone="muted" numeric lines={2} aria-hidden>
            {supporting}
          </AppText>
        )}
      </div>
    </div>
  );
}

/** Two-column tile grid used with MetricCard. */
export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

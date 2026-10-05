import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from '@phosphor-icons/react';

import { AppText } from './AppText';
import { cn } from './cn';
import type { IconType } from './icon';
import { surfaceClass } from './surface';

export type StatTrend = { direction: 'up' | 'down' | 'flat'; text: string; a11y: string };

export type StatCardProps = {
  label: string;
  value: string;
  /** Spoken value when it differs from the visual one (currency names, "percent"). */
  valueA11y?: string;
  trend?: StatTrend | null;
  /** Whether "up" is good news. False for things like cancellations. */
  upIsGood?: boolean;
  supporting?: string;
  icon?: IconType;
  tint?: 'surface' | 'accent' | 'warning';
  /** Extra content under the value, for example a progress bar. */
  children?: ReactNode;
};

/** A KPI tile for stat rows. Holds no business logic; callers pass formatted values. */
export function StatCard({ label, value, valueA11y, trend, upIsGood = true, supporting, icon: Icon, tint = 'surface', children }: StatCardProps) {
  const TrendIcon = trend?.direction === 'up' ? ArrowUpRight : trend?.direction === 'down' ? ArrowDownRight : Minus;
  const good = trend && trend.direction !== 'flat' && (trend.direction === 'up') === upIsGood;
  const trendClass = !trend || trend.direction === 'flat' ? 'bg-surface-muted text-text-muted' : good ? 'bg-accent-soft text-accent' : 'bg-danger-soft text-danger';
  const a11y = [label, valueA11y ?? value, trend?.a11y, supporting].filter(Boolean).join(', ');

  return (
    <div className={cn(surfaceClass(tint), 'flex min-w-0 flex-col gap-2 p-4 [container-type:inline-size] lg:p-5')}>
      <div role="group" aria-label={a11y} className="flex min-w-0 flex-col gap-2">
        <div aria-hidden className="flex items-center gap-2">
          {Icon && <Icon size={16} className={tint === 'warning' ? 'text-warning' : 'text-text-subtle'} />}
          <AppText variant="label" tone="muted" lines={1}>
            {label}
          </AppText>
        </div>
        <AppText variant="stat" numeric lines={1} aria-hidden style={{ fontSize: `clamp(20px, calc(100cqi / ${Math.max(1, value.length * 0.6).toFixed(2)}), 28px)` }}>
          {value}
        </AppText>
        {(trend || supporting) && (
          <div aria-hidden className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {trend && (
              <span className={cn('t-mini inline-flex items-center gap-0.5 rounded-full px-1.5 py-px font-medium tabular-nums', trendClass)}>
                <TrendIcon size={12} weight="bold" />
                {trend.text}
              </span>
            )}
            {supporting && (
              <AppText variant="small" tone="muted" numeric lines={2}>
                {supporting}
              </AppText>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/** A responsive row of stat cards: four across on desktop, two on tablets and phones. */
export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return <div className={cn('grid grid-cols-2 gap-3 lg:gap-4', columns === 3 && 'lg:grid-cols-3', columns === 4 && 'lg:grid-cols-4')}>{children}</div>;
}

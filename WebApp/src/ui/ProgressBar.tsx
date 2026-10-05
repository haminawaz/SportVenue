import { cn } from './cn';

/** Horizontal meter. `value` is 0-100 and is clamped. Decorative: pair it with a text value. */
export function ProgressBar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'onInk' }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <span aria-hidden className={cn('block h-2 overflow-hidden rounded-full', tone === 'onInk' ? 'bg-ink-line' : 'bg-track')}>
      <span className={cn('block h-full rounded-full', tone === 'onInk' ? 'bg-ink-accent' : 'bg-accent')} style={{ width: `${clamped}%` }} />
    </span>
  );
}

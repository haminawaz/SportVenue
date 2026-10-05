import { cn } from './cn';

export type BadgeTone = 'positive' | 'warning' | 'danger' | 'neutral';

const TONE: Record<BadgeTone, { box: string; dot: string }> = {
  positive: { box: 'bg-accent-soft text-accent', dot: 'bg-accent' },
  warning: { box: 'bg-warning-soft text-warning', dot: 'bg-warning' },
  danger: { box: 'bg-danger-soft text-danger', dot: 'bg-danger' },
  neutral: { box: 'bg-surface-muted text-text-muted', dot: 'bg-text-subtle' },
};

/** Status tag. Text is always the primary signal; colour only reinforces it. */
export function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <span className={cn('t-mini inline-flex h-[22px] max-w-full shrink-0 items-center gap-1.5 self-start rounded-full px-2 font-medium whitespace-nowrap', TONE[tone].box)}>
      <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE[tone].dot)} />
      <span className="truncate">{label}</span>
    </span>
  );
}

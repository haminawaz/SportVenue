import Link from 'next/link';

import { cn } from './cn';
import type { IconType } from './icon';
import { Spinner } from './Spinner';

type IconButtonProps = {
  icon: IconType;
  label: string;
  onPress?: () => void;
  href?: string;
  /** Unread count or similar, shown as a small number badge. */
  badge?: number;
  tone?: 'default' | 'danger';
  variant?: 'ghost' | 'outline';
  size?: 'sm' | 'md';
  disabled?: boolean;
  loading?: boolean;
};

/** Square icon action with a tooltip; the label is its accessible name. */
export function IconButton({ icon: Icon, label, onPress, href, badge, tone = 'default', variant = 'ghost', size = 'md', disabled, loading }: IconButtonProps) {
  const spoken = badge ? `${label}, ${badge} unread` : label;
  const cls = cn(
    'relative inline-flex shrink-0 items-center justify-center rounded-control transition-colors',
    size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
    tone === 'danger' ? 'text-danger' : 'text-text-muted hover:text-text',
    variant === 'outline' ? 'border border-border bg-surface hover:bg-surface-muted' : 'hover:bg-surface-muted',
    (disabled || loading) && 'pointer-events-none opacity-45',
  );
  const content = (
    <>
      {loading ? <Spinner size={16} /> : <Icon size={size === 'sm' ? 17 : 19} aria-hidden />}
      {!!badge && badge > 0 && (
        <span className="t-mini absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-surface bg-danger px-1 font-semibold text-on-accent tabular-nums">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </>
  );
  if (href) {
    return (
      <Link href={href} aria-label={spoken} title={label} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={spoken} title={label} aria-busy={loading || undefined} disabled={disabled || loading} onClick={onPress} className={cls}>
      {content}
    </button>
  );
}

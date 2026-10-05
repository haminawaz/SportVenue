import { initials } from '@/lib/format';

import { AppText } from './AppText';
import { cn } from './cn';

/** Initials monogram. Decorative: always sits next to the full name. */
export function Avatar({ name, size = 44, tone = 'neutral' }: { name: string; size?: number; tone?: 'neutral' | 'accent' }) {
  return (
    <span
      aria-hidden
      className={cn('flex shrink-0 items-center justify-center rounded-full', tone === 'accent' ? 'bg-accent-soft text-accent' : 'bg-surface-muted text-text-muted')}
      style={{ width: size, height: size }}
    >
      <AppText variant={size >= 56 ? 'title-md' : 'nav-link'} className="text-current">
        {initials(name)}
      </AppText>
    </span>
  );
}

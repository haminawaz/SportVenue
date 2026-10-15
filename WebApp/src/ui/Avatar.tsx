import { initials } from '@/lib/format';

import { cn } from './cn';

/**
 * Initials monogram. Decorative: always sits next to the full name. The
 * initials are drawn by CSS (::before) rather than as text, so a button or
 * link that contains an avatar is still named by its real label.
 */
export function Avatar({ name, size = 44, tone = 'neutral' }: { name: string; size?: number; tone?: 'neutral' | 'accent' }) {
  return (
    <span
      aria-hidden
      data-initials={initials(name)}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full whitespace-nowrap before:content-[attr(data-initials)]',
        size >= 56 ? 't-heading' : size >= 36 ? 't-label' : 't-mini',
        tone === 'accent' ? 'bg-accent-soft text-accent' : 'bg-surface-muted text-text-muted',
      )}
      style={{ width: size, height: size }}
    />
  );
}

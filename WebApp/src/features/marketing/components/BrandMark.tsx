'use client';

import Image from 'next/image';

import { useTheme } from '@/theme/ThemeProvider';

type BrandMarkProps = {
  size?: number;
  withName?: boolean;
  /** On the ink surface (or dark mode): the tile gets a faint edge and the wordmark turns cream. */
  onInk?: boolean;
};

/**
 * SportVenue logo: the app icon image (public/brand/mark.png, the same artwork
 * as the favicon and app icon) beside the wordmark.
 */
export function BrandMark({ size = 36, withName = true, onInk }: BrandMarkProps) {
  const { scheme } = useTheme();
  const raised = onInk || scheme === 'dark';

  return (
    <span role="img" aria-label="SportVenue" className="flex items-center gap-2.5">
      <Image
        src="/brand/mark.png"
        alt=""
        aria-hidden
        width={size}
        height={size}
        priority
        className="block shrink-0"
        style={{ width: size, height: size, borderRadius: size * 0.24, boxShadow: raised ? '0 0 0 1px rgba(243, 241, 238, 0.18)' : undefined }}
      />
      {withName && (
        <span aria-hidden className={onInk ? 'text-on-ink' : 'text-text'} style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, letterSpacing: 0.4, fontSize: Math.round(size * 0.5), lineHeight: 1 }}>
          SPORTVENUE
        </span>
      )}
    </span>
  );
}

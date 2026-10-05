'use client';

import { useTheme } from '@/theme/ThemeProvider';

/** Brand colours, fixed so the logo looks the same in every theme. */
const BRAND = { ink: '#141413', flap: '#2A2927', green: '#0B7A4B', lime: '#4ADE9A', cream: '#F3F1EE' };

type BrandMarkProps = {
  size?: number;
  withName?: boolean;
  /** On the ink surface (or dark mode): the tile lifts to a lighter step and the wordmark turns cream. */
  onInk?: boolean;
};

/**
 * SportVenue scoreboard mark: S and V on split-flap tiles, the V in court
 * green. Built from elements (not an image) so it stays crisp at every size.
 * The flap split line is dropped below 36px, where it would only blur.
 */
export function BrandMark({ size = 36, withName = true, onInk }: BrandMarkProps) {
  const { scheme } = useTheme();
  const raised = onInk || scheme === 'dark';
  const tile = raised ? BRAND.flap : BRAND.ink;
  const leftFlap = raised ? BRAND.ink : BRAND.flap;
  const s = size / 100;

  return (
    <span role="img" aria-label="SportVenue" className="flex items-center gap-2.5">
      {/* In dark mode the tile gets a faint edge so it reads on any dark surface, including ones the same tone as the tile. */}
      <span
        aria-hidden
        className="relative block shrink-0"
        style={{ width: size, height: size, borderRadius: 26 * s, backgroundColor: tile, boxShadow: raised ? 'inset 0 0 0 1px rgba(243, 241, 238, 0.22)' : undefined }}
      >
        <Flap left={15 * s} scale={s} color={leftFlap} letter="S" letterColor={BRAND.cream} />
        <Flap left={52 * s} scale={s} color={BRAND.green} letter="V" letterColor={BRAND.lime} />
        {size >= 36 && <span className="absolute block" style={{ left: 15 * s, width: 70 * s, top: 48.5 * s, height: 3 * s, backgroundColor: tile }} />}
      </span>
      {withName && (
        <span aria-hidden className={onInk ? 'text-on-ink' : 'text-text'} style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, letterSpacing: 0.4, fontSize: Math.round(size * 0.5), lineHeight: 1 }}>
          SPORTVENUE
        </span>
      )}
    </span>
  );
}

function Flap({ left, scale: s, color, letter, letterColor }: { left: number; scale: number; color: string; letter: string; letterColor: string }) {
  return (
    <span className="absolute flex items-center justify-center" style={{ left, top: 22 * s, width: 33 * s, height: 56 * s, borderRadius: 7 * s, backgroundColor: color }}>
      <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, color: letterColor, fontSize: 40 * s, lineHeight: `${48 * s}px` }}>{letter}</span>
    </span>
  );
}

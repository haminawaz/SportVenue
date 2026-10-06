import Image from 'next/image';

import { cn } from '@/ui/cn';

export type ShotName = 'dashboard' | 'schedule' | 'payments' | 'customers' | 'pricing' | 'analytics';

/** Captured at 1440x900, 2x density. */
const WIDTH = 2880;
const HEIGHT = 1800;

type ProductShotProps = {
  name: ShotName;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Without its own frame (border, radius, shadow), for use inside a frame that clips it. */
  bare?: boolean;
};

/**
 * A real screenshot of the SportVenue app (seeded sample facility), shown in
 * the visitor's theme: the light capture in light mode, the dark one in dark.
 */
/** The frame around a screenshot: hairline edge, card radius, soft shadow in light mode. */
export const SHOT_FRAME = 'overflow-hidden rounded-card border border-border-strong/70 bg-surface shadow-[0_24px_60px_-20px_rgba(42,33,23,0.25)] dark:shadow-none';

export function ProductShot({ name, alt, priority, sizes = '(min-width: 1200px) 1136px, 100vw', className, bare }: ProductShotProps) {
  const common = { width: WIDTH, height: HEIGHT, sizes, priority, className: 'block h-auto w-full' };
  return (
    <div className={cn(!bare && SHOT_FRAME, className)}>
      <Image src={`/landing/${name}-light.webp`} alt={alt} {...common} className={cn(common.className, 'dark:hidden')} />
      <Image src={`/landing/${name}-dark.webp`} alt="" aria-hidden {...common} className={cn(common.className, 'hidden dark:block')} />
    </div>
  );
}

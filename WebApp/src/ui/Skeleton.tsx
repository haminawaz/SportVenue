import type { CSSProperties } from 'react';

import { radius as radii } from '@/theme/tokens';

import { cn } from './cn';

type SkeletonProps = {
  width?: number | string;
  height: number;
  radius?: number;
  className?: string;
  style?: CSSProperties;
};

/** Placeholder block. Pulses gently to signal loading; static under reduced motion. */
export function Skeleton({ width = '100%', height, radius = radii.badge, className, style }: SkeletonProps) {
  return <span aria-hidden className={cn('block animate-skeleton bg-skeleton', className)} style={{ width, height, borderRadius: radius, ...style }} />;
}

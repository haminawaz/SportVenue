import { cn } from './cn';

/** Small activity indicator. Inherits colour from the surrounding text. */
export function Spinner({ size = 20, label, className }: { size?: number; label?: string; className?: string }) {
  return (
    <span
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent', className)}
      style={{ width: size, height: size }}
    />
  );
}

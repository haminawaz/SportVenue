import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { AppText } from './AppText';
import { cn } from './cn';
import { surfaceClass, type SurfaceTint } from './surface';

type CardProps = { children: ReactNode; tint?: SurfaceTint; className?: string; padded?: boolean; as?: 'div' | 'section' | 'article' };

/** A bordered surface. Pass padded={false} when the card holds a table or a list that runs edge to edge. */
export function Card({ children, tint = 'surface', className, padded = true, as: Tag = 'div' }: CardProps) {
  return <Tag className={cn(surfaceClass(tint), padded && 'p-5', 'min-w-0', className)}>{children}</Tag>;
}

type CardHeaderProps = { title: string; description?: string; actions?: ReactNode; count?: number; className?: string };

/** Title row for a card: title (and optional count/description) left, actions right. */
export function CardHeader({ title, description, actions, count, className }: CardHeaderProps) {
  return (
    <div className={cn('flex min-h-14 items-center gap-3 border-b border-border px-5 py-3', className)}>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <AppText as="h2" variant="heading" lines={1}>
            {title}
          </AppText>
          {count !== undefined && count > 0 && <span className="t-mini rounded-full bg-surface-muted px-1.5 py-px font-semibold text-text-muted tabular-nums">{count}</span>}
        </div>
        {description && (
          <AppText variant="small" tone="muted">
            {description}
          </AppText>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

type PressableCardProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'> & { children: ReactNode; tint?: SurfaceTint; className?: string; onPress: () => void };

/** A card that opens something. Always pass an aria-label describing the destination. */
export function PressableCard({ children, tint = 'surface', className, onPress, ...rest }: PressableCardProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      {...rest}
      className={cn(surfaceClass(tint), 'block w-full p-5 text-left transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-[0_4px_12px_rgba(42,33,23,0.06)]', className)}
    >
      {children}
    </button>
  );
}

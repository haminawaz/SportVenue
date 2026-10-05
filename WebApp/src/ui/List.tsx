import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { CaretRight } from '@phosphor-icons/react';

import { AppText, type Tone } from './AppText';
import { cn } from './cn';
import type { IconType } from './icon';

/** Grouped rows on one elevated surface, separated by inset hairlines. */
export function ListGroup({ children, title, footer }: { children: ReactNode; title?: string; footer?: string }) {
  const items = Children.toArray(children).filter(isValidElement);
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      {title && (
        <AppText as="h2" variant="display-sm" className="px-0.5">
          {title}
        </AppText>
      )}
      <div className="surface-card overflow-hidden">
        {items.map((child, i) => (
          <Fragment key={child.key ?? i}>
            {i > 0 && <div aria-hidden className="ml-5 h-px bg-border" />}
            {child}
          </Fragment>
        ))}
      </div>
      {footer && (
        <AppText variant="body-sm" tone="muted" className="px-1">
          {footer}
        </AppText>
      )}
    </section>
  );
}

type ValueTone = Extract<Tone, 'default' | 'muted' | 'warning' | 'danger' | 'accent'>;

type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Right-aligned value text. */
  value?: string;
  valueTone?: ValueTone;
  icon?: IconType;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** A real link (tel:, mailto:, an external site) instead of an in-app action. */
  href?: string;
  /** Open `href` in a new tab (maps, websites). */
  external?: boolean;
  destructive?: boolean;
  /** Screen-reader label; defaults to title, subtitle and value. */
  label?: string;
  hint?: string;
  titleLines?: number;
  disabled?: boolean;
};

export function ListRow({ title, subtitle, value, valueTone = 'muted', icon: Icon, leading, trailing, onPress, href, external, destructive, label, hint, titleLines = 2, disabled }: ListRowProps) {
  const a11y = label ?? [title, subtitle, value].filter(Boolean).join(', ');
  const interactive = !!onPress || !!href;

  const content = (
    <>
      {leading}
      {Icon && !leading && (
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', destructive ? 'bg-danger-soft text-danger' : 'bg-surface-muted text-text')}>
          <Icon size={22} aria-hidden />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <AppText variant="body-strong" lines={titleLines > 4 ? undefined : titleLines} className={cn('whitespace-pre-line', destructive && 'text-danger')}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body-sm" tone="muted" lines={4} className="whitespace-pre-line">
            {subtitle}
          </AppText>
        ) : null}
      </span>
      {value !== undefined && (
        <AppText variant="body-md" tone={valueTone} numeric lines={2} className="max-w-[48%] text-right">
          {value}
        </AppText>
      )}
      {trailing}
      {interactive && !destructive && <CaretRight size={18} weight="bold" className="-ml-1 shrink-0 text-text-subtle" aria-hidden />}
    </>
  );

  const rowClass = 'flex min-h-[72px] w-full items-center gap-4 px-5 py-4 text-left';

  if (href) {
    return (
      <a
        href={href}
        aria-label={a11y}
        title={hint}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={cn(rowClass, 'transition-colors hover:bg-surface-muted/60 active:bg-surface-muted')}
      >
        {content}
      </a>
    );
  }
  if (!onPress) {
    return (
      <div role="group" aria-label={a11y} className={rowClass}>
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-label={a11y}
      title={hint}
      onClick={onPress}
      disabled={disabled}
      className={cn(rowClass, 'transition-colors hover:bg-surface-muted/60 active:bg-surface-muted', disabled && 'opacity-50')}
    >
      {content}
    </button>
  );
}

type SummaryRowProps = {
  title: string;
  /** Right side of the first line, usually an amount. */
  value?: string;
  valueTone?: ValueTone;
  /** One line of detail under the title. Keep it to one separator. */
  meta?: string;
  /** Right side of the second line: at most one status tag. */
  tag?: ReactNode;
  leading?: ReactNode;
  onPress: () => void;
  /** Screen-reader label for the whole row. */
  label: string;
  hint?: string;
};

/**
 * Two-line list row for dense lists (customers, balances, payments):
 * who and how much, then one line of detail and at most one tag. Nothing
 * wraps, so every row has the same rhythm.
 */
export function SummaryRow({ title, value, valueTone = 'default', meta, tag, leading, onPress, label, hint }: SummaryRowProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={hint}
      onClick={onPress}
      className="flex min-h-[72px] w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-muted/60 active:bg-surface-muted"
    >
      {leading}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-3">
          <AppText variant="body-strong" lines={1} className="flex-1">
            {title}
          </AppText>
          {value !== undefined && (
            <AppText variant="body-strong" tone={valueTone} numeric lines={1} className="shrink-0">
              {value}
            </AppText>
          )}
        </span>
        {(meta || tag) && (
          <span className="flex items-center gap-3">
            <AppText variant="body-sm" tone="muted" numeric lines={1} className="flex-1">
              {meta}
            </AppText>
            {tag}
          </span>
        )}
      </span>
    </button>
  );
}

'use client';

import { Fragment, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { CaretRight } from '@phosphor-icons/react';

import { AppText } from './AppText';
import { cn } from './cn';
import { RefreshButton, useRegisterRefresh } from './Refresh';

/** Names the browser tab after the current screen. */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · SportVenue` : 'SportVenue';
  }, [title]);
}

const WIDTH = { full: 'max-w-[1440px]', wide: 'max-w-[1200px]', form: 'max-w-[1040px]', narrow: 'max-w-[760px]' };

type PageProps = {
  children: ReactNode;
  /** full: dashboards and tables; form: create/edit screens; narrow: single-column reading. */
  width?: keyof typeof WIDTH;
  /** What "Refresh" in the page header does (refetch this screen's data). */
  onRefresh?: () => Promise<unknown> | void;
  className?: string;
};

/** The content area of a screen: a centred container with desktop gutters that tighten on small screens. */
export function Page({ children, width = 'full', onRefresh, className }: PageProps) {
  useRegisterRefresh(onRefresh);
  return <main className={cn('mx-auto flex w-full flex-1 flex-col gap-6 px-4 pt-5 pb-10 sm:px-6 lg:px-8 lg:pt-7', WIDTH[width], className)}>{children}</main>;
}

export type Crumb = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Trail back to the parent screens; replaces a mobile back button. */
  breadcrumbs?: Crumb[];
  /** Badges or small facts shown after the title. */
  meta?: ReactNode;
  /** Primary and secondary actions, right-aligned on desktop. */
  actions?: ReactNode;
  /** Leading visual, for example an avatar. */
  leading?: ReactNode;
  /** Hide the Refresh button even when the page registered one. */
  hideRefresh?: boolean;
};

export function PageHeader({ title, description, breadcrumbs, meta, actions, leading, hideRefresh }: PageHeaderProps) {
  useDocumentTitle(title);
  return (
    <header className="flex flex-col gap-3">
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {leading}
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <AppText as="h1" variant="page-title" className="min-w-0">
                {title}
              </AppText>
              {meta}
            </div>
            {description && (
              <AppText as="div" variant="text" tone="muted">
                {description}
              </AppText>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
          {!hideRefresh && <RefreshButton />}
          {actions}
        </div>
      </div>
    </header>
  );
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-text-muted">
        {items.map((c, i) => (
          <Fragment key={`${c.label}-${i}`}>
            {i > 0 && <CaretRight size={12} aria-hidden className="text-text-subtle" />}
            <li className="min-w-0">
              {c.href ? (
                <Link href={c.href} className="t-small rounded hover:text-text hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page" className="t-small text-text">
                  {c.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Save/cancel bar at the end of a form. It sticks to the bottom of the
 * viewport while the form scrolls so the main action is always reachable.
 */
export function FormActions({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-2 border-t border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {note && <div className="mr-auto">{note}</div>}
        {children}
      </div>
    </div>
  );
}

/** Two-column detail layout: main content and a narrower side column (stacks on small screens). */
export function DetailLayout({ main, side }: { main: ReactNode; side: ReactNode }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-6">{main}</div>
      <aside className="flex min-w-0 flex-col gap-6">{side}</aside>
    </div>
  );
}

/**
 * A form section: title and explanation on the left, fields on the right
 * (stacked on smaller screens), the layout used by settings-style forms.
 */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-border py-6 first:pt-0 last:border-b-0 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col gap-1">
        <AppText as="h2" variant="heading">
          {title}
        </AppText>
        {description && (
          <AppText variant="small" tone="muted">
            {description}
          </AppText>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </section>
  );
}

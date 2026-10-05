'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react';

import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { useDocumentTitle } from '@/ui/Page';

import { BrandMark } from './BrandMark';

type AuthLayoutProps = {
  /** Small label above the title (with the landing page's accent dot). */
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** Up to three short points, for example what happens after signing up. */
  points?: string[];
  children: ReactNode;
};

/**
 * Frame for the signed-out screens (Log in, Get started). On desktop a brand
 * panel with the title and points sits beside the form; on smaller screens
 * the title stacks above it.
 */
export function AuthLayout({ eyebrow, title, lead, points, children }: AuthLayoutProps) {
  const router = useAppRouter();
  useDocumentTitle(title);

  const intro = title && (
    <div className="flex flex-col gap-3">
      {eyebrow && (
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 rounded-full bg-accent-decor" />
          <AppText variant="caption-uppercase" className="text-current opacity-75">
            {eyebrow}
          </AppText>
        </div>
      )}
      <AppText as="h1" variant="display-xl" className="text-current">
        {title}
      </AppText>
      {lead && (
        <AppText as="p" variant="body-md" className="max-w-[440px] text-current opacity-75">
          {lead}
        </AppText>
      )}
      {points && points.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3">
          {points.slice(0, 3).map((p) => (
            <li key={p} className="flex items-start gap-2.5">
              <CheckCircle size={20} weight="fill" className="shrink-0 text-accent lg:text-ink-accent" aria-hidden />
              <AppText variant="body-sm" className="flex-1 text-current">
                {p}
              </AppText>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-ink p-10 text-on-ink lg:flex xl:p-14">
        <Link href={routes.welcome} aria-label="SportVenue home" className="self-start">
          <BrandMark size={32} onInk />
        </Link>
        <div className="max-w-[460px]">{intro}</div>
        <AppText variant="small" className="text-on-ink-muted">
          © 2026 SportVenue
        </AppText>
      </aside>

      <main className="flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+32px)] sm:px-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back(routes.welcome)}
            className="t-label inline-flex h-9 items-center gap-1.5 rounded-control px-2 text-text-muted hover:bg-surface-muted hover:text-text"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} weight="bold" aria-hidden />
            Back
          </button>
          <span className="lg:hidden">
            <BrandMark size={28} />
          </span>
        </div>
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center gap-6 py-8">
          <div className="text-text lg:hidden">{intro}</div>
          <div className="flex animate-rise flex-col gap-5">{children}</div>
        </div>
      </main>
    </div>
  );
}

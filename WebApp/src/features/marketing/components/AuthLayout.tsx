'use client';

import type { ReactNode } from 'react';
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react';

import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { useDocumentTitle } from '@/ui/LargeTitle';

import { BrandMark } from './BrandMark';

type AuthLayoutProps = {
  /** Small label above the title (with the landing page's accent dot). */
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** Up to three short points shown in the panel, for example what happens after signing up. */
  points?: string[];
  children: ReactNode;
};

/**
 * Shared frame for the signed-out screens (Log in, Get started), in the landing
 * page's language: a soft grey panel with the brand, title and optional points,
 * then the form card overlapping its bottom edge.
 */
export function AuthLayout({ eyebrow, title, lead, points, children }: AuthLayoutProps) {
  const router = useAppRouter();
  useDocumentTitle(title);

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-[calc(env(safe-area-inset-bottom)+32px)]">
      <div className="rounded-b-hero bg-surface-muted px-5 pt-[calc(env(safe-area-inset-top)+8px)] pb-16">
        <div className="mx-auto w-full max-w-[480px]">
          <div className="flex min-h-14 items-center justify-between">
            <button
              type="button"
              aria-label="Back to home"
              onClick={() => router.back(routes.welcome)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text transition-opacity hover:opacity-80 active:opacity-70"
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
            <BrandMark size={30} />
            <span className="w-11" />
          </div>

          {title && (
            <div className="mt-6 flex flex-col gap-3">
              {eyebrow && (
                <div className="flex items-center gap-2">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-accent-decor" />
                  <AppText variant="caption-uppercase" tone="muted">
                    {eyebrow}
                  </AppText>
                </div>
              )}
              <AppText as="h1" variant="display-xl">
                {title}
              </AppText>
              {lead && (
                <AppText as="p" tone="muted" className="max-w-[440px]">
                  {lead}
                </AppText>
              )}
              {points && points.length > 0 && (
                <ul className="mt-2 flex flex-col gap-2.5">
                  {points.slice(0, 3).map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <CheckCircle size={20} weight="fill" className="shrink-0 text-accent" aria-hidden />
                      <AppText variant="body-sm" className="flex-1">
                        {p}
                      </AppText>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* The form card overlaps the panel's rounded bottom edge and rises in once. */}
      <div className="mx-auto -mt-10 flex w-full max-w-[480px] animate-rise flex-col gap-5 px-4">{children}</div>
    </div>
  );
}

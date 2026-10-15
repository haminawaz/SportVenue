import type { Metadata } from 'next';
import Link from 'next/link';

import { BrandMark } from '@/features/marketing/components/BrandMark';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

/** Any unknown address. "/" opens the dashboard when signed in and the landing page otherwise. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-5 text-center">
      <Link href="/" aria-label="SportVenue home" className="rounded-control">
        <BrandMark size={32} />
      </Link>
      <p className="t-overline text-text-subtle">Error 404</p>
      <h1 className="t-display-xl">Page not found</h1>
      <p className="max-w-[40ch] t-body-md text-text-muted">This page doesn’t exist in SportVenue. The link may be old or mistyped.</p>
      <Link href="/" className="t-button inline-flex min-h-[46px] items-center rounded-control bg-primary px-[18px] text-on-primary hover:opacity-90">
        Go to the homepage
      </Link>
    </main>
  );
}

'use client';

/** The current year, read in the browser so a page prerendered last year still shows this one. */
export function CurrentYear() {
  return <span suppressHydrationWarning>{new Date().getFullYear()}</span>;
}

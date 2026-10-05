import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-5 text-center">
      <h1 className="t-display-xl">Page not found</h1>
      <p className="t-body-md text-text-muted">This page doesn’t exist in SportVenue.</p>
      <Link href="/" className="t-button inline-flex min-h-[46px] items-center rounded-control bg-primary px-[18px] text-on-primary hover:opacity-90">
        Go home
      </Link>
    </main>
  );
}

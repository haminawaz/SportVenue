import { Fragment } from 'react';
import Link from 'next/link';

import { BrandMark } from '@/features/marketing/components/BrandMark';
import { cn } from '@/ui/cn';
import { CurrentYear } from '@/ui/CurrentYear';

import { LAST_UPDATED, LEGAL_DETAILS_PENDING, LEGAL_LINKS, parseInline, type LegalBlock, type LegalDocument } from './content';
import { CookieSettingsButton } from './CookieSettingsButton';

const COLUMN = 'mx-auto w-full max-w-[760px] px-5 sm:px-8';
const LINK = 'font-semibold text-accent underline underline-offset-2 hover:opacity-80';

/** One legal string: plain text, bold lead-ins, links and pending details. */
function Inline({ text }: { text: string }) {
  return parseInline(text).map((part, i) => {
    switch (part.kind) {
      case 'strong':
        return (
          <strong key={i} className="font-semibold text-text">
            {part.text}
          </strong>
        );
      case 'pending':
        return (
          <mark key={i} title="To be confirmed before launch" className="rounded-sm bg-warning-soft px-1 text-warning">
            {part.text} (pending)
          </mark>
        );
      case 'link':
        return part.href.startsWith('/') ? (
          <Link key={i} href={part.href} className={LINK}>
            {part.text}
          </Link>
        ) : (
          <a key={i} href={part.href} className={LINK} {...(part.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {part.text}
          </a>
        );
      default:
        return <Fragment key={i}>{part.text}</Fragment>;
    }
  });
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === 'string') {
    return (
      <p className="t-body-md text-text-muted">
        <Inline text={block} />
      </p>
    );
  }
  if ('list' in block) {
    return (
      <ul className="flex list-disc flex-col gap-2 pl-5 t-body-md text-text-muted marker:text-text-subtle">
        {block.list.map((item) => (
          <li key={item}>
            <Inline text={item} />
          </li>
        ))}
      </ul>
    );
  }
  if ('table' in block) {
    const { head, rows } = block.table;
    return (
      <>
        {/* Tablets and up: a table. */}
        <div className="hidden overflow-hidden rounded-card border border-border sm:block">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-muted">
              <tr>
                {head.map((h) => (
                  <th key={h} scope="col" className="px-4 py-2.5 t-label text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-t border-border align-top">
                  {row.map((cell, i) => (
                    <td key={i} className={cn('px-4 py-3 t-body-sm', i === 0 ? 'font-medium wrap-break-word text-text' : 'text-text-muted')}>
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Phones: one card per row, so nothing scrolls sideways. */}
        <div className="flex flex-col gap-3 sm:hidden">
          {rows.map((row) => (
            <dl key={row[0]} className="flex flex-col gap-2 rounded-card border border-border p-4">
              {row.map((cell, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <dt className="t-label text-text-subtle">{head[i]}</dt>
                  <dd className={cn('t-body-sm wrap-break-word', i === 0 ? 'font-medium text-text' : 'text-text-muted')}>
                    <Inline text={cell} />
                  </dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
      </>
    );
  }
  return (
    <div>
      <CookieSettingsButton />
    </div>
  );
}

/**
 * A legal document page (privacy, terms, cookies). Rendered on the server so
 * the full text is in the HTML, and readable signed in or signed out.
 */
export function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border pt-[env(safe-area-inset-top)]">
        <div className={cn(COLUMN, 'flex h-16 items-center')}>
          <Link href="/" aria-label="SportVenue home" className="rounded-control">
            <BrandMark size={28} />
          </Link>
        </div>
      </header>

      <main className={cn(COLUMN, 'flex flex-1 flex-col gap-8 py-10 sm:py-14')}>
        <div className="flex flex-col gap-4">
          <nav aria-label="Legal documents">
            <ul className="flex flex-wrap gap-2">
              {LEGAL_LINKS.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={l.href}
                    aria-current={l.slug === doc.slug ? 'page' : undefined}
                    className={cn(
                      'inline-flex min-h-9 items-center rounded-full border px-3.5 t-label transition-colors',
                      l.slug === doc.slug ? 'border-text bg-text text-background' : 'border-border-strong text-text-muted hover:text-text',
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <h1 className="t-display-xl text-text">{doc.title}</h1>
          <p className="t-body-sm text-text-muted">Last updated {LAST_UPDATED}</p>
        </div>

        {LEGAL_DETAILS_PENDING && (
          <div role="note" className="flex flex-col gap-1 rounded-card border border-warning/30 bg-warning-soft px-4 py-3">
            <p className="t-text-strong text-text">Draft</p>
            <p className="t-small text-text">
              Some details, such as who operates SportVenue and how to contact us, are still being confirmed. They are marked as pending below and will be added before launch.
            </p>
          </div>
        )}

        <nav aria-labelledby="toc-heading" className="flex flex-col gap-2 rounded-card border border-border bg-surface p-5">
          <h2 id="toc-heading" className="t-label text-text-subtle">
            On this page
          </h2>
          <ol className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="t-body-sm text-text-muted underline-offset-2 hover:text-text hover:underline">
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {doc.sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-heading`} className="flex scroll-mt-6 flex-col gap-3">
            <h2 id={`${s.id}-heading`} className="t-title-md text-text">
              {s.heading}
            </h2>
            {s.blocks.map((b, i) => (
              <Block key={i} block={b} />
            ))}
          </section>
        ))}
      </main>

      {/* Extra bottom room keeps the floating cookie badge clear of the links. */}
      <footer className="border-t border-border pt-8 pb-[calc(env(safe-area-inset-bottom)+84px)]">
        <div className={cn(COLUMN, 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between')}>
          <p className="t-caption text-text-subtle">
            © <CurrentYear /> SportVenue
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 t-body-sm text-text-muted">
            {LEGAL_LINKS.map((l) => (
              <li key={l.slug}>
                <Link href={l.href} className="hover:text-text">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsButton asLink className="hover:text-text" />
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

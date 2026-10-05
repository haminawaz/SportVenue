'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Buildings, CreditCard, Palette, UserCircle } from '@phosphor-icons/react';

import { routes } from '@/navigation/routes';
import { notePush } from '@/navigation/useAppRouter';
import { cn } from '@/ui/cn';
import type { IconType } from '@/ui/icon';
import { Page, PageHeader } from '@/ui/Page';

const SECTIONS: { href: string; label: string; icon: IconType }[] = [
  { href: routes.settings, label: 'General', icon: Palette },
  { href: routes.profile, label: 'Profile', icon: UserCircle },
  { href: routes.notificationPreferences, label: 'Notifications', icon: Bell },
  { href: routes.billing, label: 'Subscription and billing', icon: CreditCard },
  { href: routes.facility, label: 'Facility', icon: Buildings },
];

/** Settings pages share one header and a section menu: a side list on desktop, scrolling tabs on smaller screens. */
export function SettingsLayout({ children, onRefresh }: { children: ReactNode; onRefresh?: () => Promise<unknown> | void }) {
  const pathname = usePathname();
  return (
    <Page width="wide" onRefresh={onRefresh}>
      <PageHeader title="Settings" description="Your account, notifications, appearance and subscription." />
      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Settings sections" className="scrollbar-none -mx-4 overflow-x-auto border-b border-border px-4 lg:mx-0 lg:border-0 lg:px-0">
          <ul className="flex gap-1 lg:flex-col">
            {SECTIONS.map((s) => {
              const active = pathname === s.href;
              const Icon = s.icon;
              return (
                <li key={s.href} className="shrink-0">
                  <Link
                    href={s.href}
                    onClick={() => !active && notePush()}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      't-text-strong flex h-10 items-center gap-2.5 whitespace-nowrap px-3 transition-colors lg:h-9 lg:rounded-control',
                      active ? 'border-b-2 border-text text-text lg:border-b-0 lg:bg-surface-muted' : 'border-b-2 border-transparent text-text-muted hover:text-text lg:border-b-0 lg:hover:bg-surface-muted/70',
                    )}
                  >
                    <Icon size={17} aria-hidden className="hidden lg:block" />
                    {s.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
      </div>
    </Page>
  );
}

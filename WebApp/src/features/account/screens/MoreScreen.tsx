'use client';

import { Bell, Buildings, CourtBasketball, Gear, Lightbulb, Tag } from '@phosphor-icons/react';
import Link from 'next/link';

import { useUnreadCount } from '@/features/notifications/api';
import { useOpportunities } from '@/features/opportunities/api';
import { routes } from '@/navigation/routes';
import { notePush } from '@/navigation/useAppRouter';
import { useSession } from '@/session/SessionProvider';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import type { IconType } from '@/ui/icon';
import { Page, PageHeader } from '@/ui/Page';

/**
 * Everything beyond the daily screens, in one overview. On the web the
 * sidebar already lists these areas; this page keeps the mobile app's /more
 * link working and gives a summary of each.
 */
export function MoreScreen() {
  const { session } = useSession();
  const unread = useUnreadCount();
  const open = useOpportunities(['OPEN']);
  const { user, facility } = session;
  const name = `${user.firstName} ${user.lastName}`;

  const tiles: { href: string; icon: IconType; title: string; subtitle: string }[] = [
    { href: routes.courts, icon: CourtBasketball, title: 'Courts', subtitle: 'Schedules and status for each court' },
    { href: routes.pricing(), icon: Tag, title: 'Pricing', subtitle: 'Base rates, peak rates and discounts' },
    { href: routes.opportunities, icon: Lightbulb, title: 'Revenue opportunities', subtitle: open.data?.length ? `${open.data.length} open to review` : 'Ways to fill courts and collect payments' },
    { href: routes.facility, icon: Buildings, title: 'Facility profile', subtitle: 'Contact details, hours and settings' },
    { href: routes.notifications, icon: Bell, title: 'Notifications', subtitle: unread.data?.count ? `${unread.data.count} new` : 'Reminders, payments and updates' },
    { href: routes.settings, icon: Gear, title: 'Settings', subtitle: 'Account, appearance and billing' },
  ];

  return (
    <Page>
      <PageHeader title="Workspace" leading={<Avatar name={name} size={48} tone="accent" />} description={`${name} · Owner, ${facility.name}`} hideRefresh />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.href}>
            <Link href={t.href} onClick={notePush} className="surface-card flex h-full items-start gap-4 p-5 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-[0_4px_12px_rgba(42,33,23,0.06)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
                <t.icon size={20} aria-hidden />
              </span>
              <span className="flex flex-col gap-0.5">
                <AppText variant="heading">{t.title}</AppText>
                <AppText variant="small" tone="muted">
                  {t.subtitle}
                </AppText>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}

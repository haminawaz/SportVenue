'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Buildings,
  CalendarBlank,
  CalendarPlus,
  ChartLine,
  CourtBasketball,
  Gear,
  House,
  Lightbulb,
  List,
  SignOut,
  Tag,
  UserCircle,
  UsersThree,
  Wallet,
} from '@phosphor-icons/react';

import { BrandMark } from '@/features/marketing/components/BrandMark';
import { useUnreadCount } from '@/features/notifications/api';
import { useOpportunities } from '@/features/opportunities/api';
import { routes } from '@/navigation/routes';
import { notePush, useAppRouter } from '@/navigation/useAppRouter';
import { useAuth, useSession } from '@/session/SessionProvider';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { ConfirmDialog, Drawer } from '@/ui/Dialogs';
import type { IconType } from '@/ui/icon';
import { IconButton } from '@/ui/IconButton';
import { Menu } from '@/ui/Menu';
import { RefreshProvider } from '@/ui/Refresh';

type NavItem = { href: string; label: string; icon: IconType; match: string[]; badge?: 'opportunities' | 'notifications' };

/** Every area of the app, grouped the way an owner works: daily operations, the venue, then insight. */
const NAV: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: routes.home, label: 'Dashboard', icon: House, match: ['/'] },
      { href: routes.bookings, label: 'Bookings', icon: CalendarBlank, match: ['/bookings', '/booking'] },
      { href: routes.customers, label: 'Customers', icon: UsersThree, match: ['/customers', '/customer'] },
      { href: routes.payments(), label: 'Payments', icon: Wallet, match: ['/payments'] },
    ],
  },
  {
    title: 'Venue',
    items: [
      { href: routes.courts, label: 'Courts', icon: CourtBasketball, match: ['/courts', '/court'] },
      { href: routes.pricing(), label: 'Pricing', icon: Tag, match: ['/pricing'] },
      { href: routes.facility, label: 'Facility', icon: Buildings, match: ['/facility'] },
    ],
  },
  {
    title: 'Insights',
    items: [
      { href: routes.analytics, label: 'Analytics', icon: ChartLine, match: ['/analytics'] },
      { href: routes.opportunities, label: 'Opportunities', icon: Lightbulb, match: ['/opportunities'], badge: 'opportunities' },
    ],
  },
];

const FOOTER_NAV: NavItem[] = [
  { href: routes.notifications, label: 'Notifications', icon: Bell, match: ['/notifications'], badge: 'notifications' },
  { href: routes.settings, label: 'Settings', icon: Gear, match: ['/settings', '/more'] },
];

function isActive(pathname: string, item: NavItem) {
  return item.match.some((m) => (m === '/' ? pathname === '/' : pathname === m || pathname.startsWith(`${m}/`)));
}

/**
 * Signed-in frame: a persistent sidebar with every area of the app on
 * desktop, a slim top bar with the most common actions, and the same
 * navigation in a slide-in drawer on tablets and phones.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [logout, setLogout] = useState(false);

  // Close the drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (drawer) setDrawer(false);
  }

  return (
    <RefreshProvider>
      <a href="#content" className="t-label sr-only z-[70] rounded-control bg-primary px-3 py-2 text-on-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <div className="min-h-dvh bg-background lg:pl-[248px]">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-border bg-surface lg:flex">
          <SidebarContent pathname={pathname} onLogout={() => setLogout(true)} />
        </aside>
        <Drawer visible={drawer} title="Navigation" onClose={() => setDrawer(false)}>
          <SidebarContent pathname={pathname} onLogout={() => setLogout(true)} />
        </Drawer>
        <div className="flex min-h-dvh min-w-0 flex-col">
          <TopBar onMenu={() => setDrawer(true)} onLogout={() => setLogout(true)} />
          <div id="content" className="flex min-w-0 flex-1 flex-col">
            {children}
          </div>
        </div>
      </div>
      <LogoutDialog visible={logout} onCancel={() => setLogout(false)} />
    </RefreshProvider>
  );
}

function SidebarContent({ pathname, onLogout }: { pathname: string; onLogout: () => void }) {
  const unread = useUnreadCount();
  const open = useOpportunities(['OPEN']);
  const { session } = useSession();
  const counts = { notifications: unread.data?.count ?? 0, opportunities: open.data?.length ?? 0 };
  const name = `${session.user.firstName} ${session.user.lastName}`;

  const link = (item: NavItem) => {
    const active = isActive(pathname, item);
    const Icon = item.icon;
    const count = item.badge ? counts[item.badge] : 0;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          onClick={() => !active && notePush()}
          className={cn(
            't-text-strong flex h-9 items-center gap-3 rounded-control px-3 transition-colors',
            active ? 'bg-surface-muted text-text' : 'text-text-muted hover:bg-surface-muted/70 hover:text-text',
          )}
        >
          <Icon size={18} weight={active ? 'fill' : 'regular'} aria-hidden className={active ? 'text-accent' : undefined} />
          <span className="flex-1">{item.label}</span>
          {count > 0 && (
            <span className="t-mini rounded-full bg-accent-soft px-1.5 py-px font-semibold text-accent tabular-nums" aria-label={`${count} new`}>
              {count}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Main" className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
        <BrandMark size={26} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        {NAV.map((group, i) => (
          <div key={group.title ?? i} className="flex flex-col gap-1">
            {group.title && (
              <AppText as="h2" variant="overline" tone="subtle" className="px-3 pb-1">
                {group.title}
              </AppText>
            )}
            <ul className="flex flex-col gap-0.5">{group.items.map(link)}</ul>
          </div>
        ))}
        <ul className="mt-auto flex flex-col gap-0.5">{FOOTER_NAV.map(link)}</ul>
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t border-border px-4 py-3">
        <Avatar name={name} size={34} tone="accent" />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppText variant="text-strong" lines={1}>
            {name}
          </AppText>
          <AppText variant="mini" tone="muted" lines={1}>
            Owner, {session.facility.name}
          </AppText>
        </div>
        <IconButton icon={SignOut} label="Log out" size="sm" onPress={onLogout} />
      </div>
    </nav>
  );
}

function TopBar({ onMenu, onLogout }: { onMenu: () => void; onLogout: () => void }) {
  const router = useAppRouter();
  const unread = useUnreadCount();
  const { session } = useSession();
  const name = `${session.user.firstName} ${session.user.lastName}`;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <IconButton icon={List} label="Open navigation" onPress={onMenu} />
        <BrandMark size={24} withName={false} />
      </div>
      <AppText variant="small" tone="muted" lines={1} className="hidden lg:block">
        {session.facility.name}
      </AppText>
      <div className="ml-auto flex items-center gap-1.5">
        <Button label="New booking" icon={CalendarPlus} size="sm" onPress={() => router.push(routes.bookingNew())} className="hidden sm:inline-flex" />
        <Button label="New booking" icon={CalendarPlus} size="sm" iconOnly onPress={() => router.push(routes.bookingNew())} className="sm:hidden" />
        <IconButton icon={Bell} label="Notifications" href={routes.notifications} badge={unread.data?.count} />
        <Menu
          label="Account"
          variant="ghost"
          triggerContent={<Avatar name={name} size={28} />}
          actions={[
            { key: 'profile', label: 'Profile', icon: UserCircle, onSelect: () => router.push(routes.profile) },
            { key: 'settings', label: 'Settings', icon: Gear, onSelect: () => router.push(routes.settings) },
            'divider',
            { key: 'logout', label: 'Log out', icon: SignOut, destructive: true, onSelect: onLogout },
          ]}
        />
      </div>
    </header>
  );
}

/** Log-out confirmation, shared by the sidebar, the account menu and the settings pages. */
export function LogoutDialog({ visible, onCancel }: { visible: boolean; onCancel: () => void }) {
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <ConfirmDialog
      visible={visible}
      title="Log out of SportVenue?"
      message="You'll need your email and password to log back in on this device."
      confirmLabel="Log out"
      cancelLabel="Stay"
      destructive
      loading={busy}
      onCancel={() => {
        setBusy(false);
        onCancel();
      }}
      onConfirm={async () => {
        setBusy(true);
        await signOut();
      }}
    />
  );
}

'use client';

import { createContext, useCallback, useContext, useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cookie } from '@phosphor-icons/react';

import { consentStore, type ConsentChoices, type ConsentRecord } from '@/lib/consent';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Modal } from '@/ui/Dialogs';
import { SwitchRow } from '@/ui/Fields';
import { Portal } from '@/ui/Overlay';

/**
 * Public pages that show the floating cookie badge. In the signed-in app the
 * badge would sit on the sidebar and the form save bars, so the same settings
 * live under Settings > General instead.
 */
const BADGE_PATHS = ['/welcome', '/sign-in', '/request-demo', '/forgot-password', '/reset-password', '/privacy', '/terms', '/cookies'];

/** What the server renders: choices live in the browser, so nothing shows until hydration. */
const UNKNOWN = 'unknown' as const;

const OpenSettingsContext = createContext<(() => void) | null>(null);

/** Opens the cookie settings dialog (footer links, Settings, the Cookie Policy). */
export function useOpenCookieSettings() {
  const open = useContext(OpenSettingsContext);
  if (!open) throw new Error('useOpenCookieSettings must be used inside <CookieConsentProvider>');
  return open;
}

/**
 * Cookie consent: a banner on the first visit (reject and accept side by side,
 * equally weighted), a settings dialog, and a floating badge on public pages to
 * change or withdraw the choice later. Nothing optional runs today; any tool
 * added later must check hasConsent() from lib/consent.
 */
export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const record = useSyncExternalStore<ConsentRecord | null | typeof UNKNOWN>(consentStore.subscribe, consentStore.get, () => UNKNOWN);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const openSettings = useCallback(() => setOpen(true), []);

  const decide = (choices: ConsentChoices) => {
    consentStore.set(choices);
    setOpen(false);
  };

  const decided = record !== null && record !== UNKNOWN;
  return (
    <OpenSettingsContext.Provider value={openSettings}>
      {children}
      {record === null && !open && <ConsentBanner onReject={() => decide({ analytics: false })} onAccept={() => decide({ analytics: true })} onChoose={openSettings} />}
      {decided && BADGE_PATHS.includes(pathname) && <CookieBadge onPress={openSettings} />}
      {open && <CookieSettingsDialog initial={decided ? record.choices : { analytics: false }} onSave={decide} onClose={() => setOpen(false)} />}
    </OpenSettingsContext.Provider>
  );
}

function ConsentBanner({ onReject, onAccept, onChoose }: { onReject: () => void; onAccept: () => void; onChoose: () => void }) {
  return (
    <Portal>
      <section
        aria-label="Cookie consent"
        className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-50 flex animate-rise flex-col gap-3 rounded-card border border-border-strong bg-surface p-4 shadow-raised sm:right-auto sm:left-4 sm:w-[420px]"
      >
        <div className="flex items-start gap-3">
          <Cookie size={22} weight="duotone" aria-hidden className="mt-0.5 shrink-0 text-accent" />
          <div className="flex min-w-0 flex-col gap-1">
            <AppText as="h2" variant="text-strong">
              Cookies and storage
            </AppText>
            <AppText as="p" variant="small" tone="muted">
              SportVenue only stores what it needs to work, like keeping you signed in. We don’t use advertising cookies, and analytics stays off unless you allow it.{' '}
              <Link href="/cookies" className="font-semibold text-accent underline underline-offset-2">
                Cookie Policy
              </Link>
            </AppText>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button label="Reject optional" variant="secondary" size="sm" block onPress={onReject} />
          <Button label="Accept all" variant="secondary" size="sm" block onPress={onAccept} />
        </div>
        <Button label="Choose what to allow" variant="tertiary" size="sm" onPress={onChoose} className="self-center" />
      </section>
    </Portal>
  );
}

function CookieBadge({ onPress }: { onPress: () => void }) {
  return (
    <Portal>
      <button
        type="button"
        aria-label="Cookie settings"
        title="Cookie settings"
        onClick={onPress}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] left-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-strong bg-surface text-text-muted shadow-raised transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Cookie size={20} weight="duotone" aria-hidden />
      </button>
    </Portal>
  );
}

function CookieSettingsDialog({ initial, onSave, onClose }: { initial: ConsentChoices; onSave: (c: ConsentChoices) => void; onClose: () => void }) {
  const [analytics, setAnalytics] = useState(initial.analytics);
  return (
    <Modal
      visible
      title="Cookie settings"
      description="Choose what SportVenue may store on this device. You can change this at any time."
      onClose={onClose}
      footer={
        <>
          <Button label="Reject optional" variant="secondary" onPress={() => onSave({ analytics: false })} />
          <Button label="Accept all" variant="secondary" onPress={() => onSave({ analytics: true })} />
          <Button label="Save choices" onPress={() => onSave({ analytics })} />
        </>
      }
    >
      <div className="flex flex-col divide-y divide-border">
        <div className="flex items-start gap-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <AppText variant="text-strong">Strictly necessary</AppText>
            <AppText variant="small" tone="muted">
              Keeps you signed in, makes Back work, and remembers choices you make, like your theme and these settings.
            </AppText>
          </div>
          <AppText variant="small" tone="muted" className="shrink-0 pt-0.5">
            Always on
          </AppText>
        </div>
        <SwitchRow
          label="Analytics"
          description="Helps us understand how SportVenue is used. We don’t use any analytics tools today. If we add one, it only runs while this is on."
          value={analytics}
          onChange={setAnalytics}
        />
      </div>
      <AppText as="p" variant="small" tone="muted">
        Everything we store is listed in our{' '}
        <Link href="/cookies" onClick={onClose} className="font-semibold text-accent underline underline-offset-2">
          Cookie Policy
        </Link>
        .
      </AppText>
    </Modal>
  );
}

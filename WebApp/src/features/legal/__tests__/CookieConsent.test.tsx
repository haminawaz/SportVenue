import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CONSENT_KEY } from '@/lib/consent';
import { ThemeProvider } from '@/theme/ThemeProvider';

const nav = vi.hoisted(() => ({ pathname: '/welcome' }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }));

/** The consent store caches its snapshot per module, so each test loads a fresh copy. */
async function renderConsent(pathname = '/welcome') {
  nav.pathname = pathname;
  vi.resetModules();
  const { CookieConsentProvider } = await import('../CookieConsent');
  return render(
    <ThemeProvider scheme="light">
      <CookieConsentProvider>
        <p>page</p>
      </CookieConsentProvider>
    </ThemeProvider>,
  );
}

const stored = () => JSON.parse(window.localStorage.getItem(CONSENT_KEY) ?? 'null');

beforeEach(() => {
  window.localStorage.clear();
});

describe('cookie consent', () => {
  it('asks on the first visit with reject and accept side by side', async () => {
    await renderConsent();
    const banner = screen.getByRole('region', { name: 'Cookie consent' });
    expect(within(banner).getByRole('button', { name: 'Reject optional' })).toBeInTheDocument();
    expect(within(banner).getByRole('button', { name: 'Accept all' })).toBeInTheDocument();
    expect(within(banner).getByRole('link', { name: 'Cookie Policy' })).toHaveAttribute('href', '/cookies');
    expect(screen.queryByRole('button', { name: 'Cookie settings' })).not.toBeInTheDocument();
  });

  it('stores a rejection, hides the banner and shows the settings badge', async () => {
    await renderConsent();
    await userEvent.click(screen.getByRole('button', { name: 'Reject optional' }));
    expect(stored().choices).toEqual({ analytics: false });
    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cookie settings' })).toBeInTheDocument();
  });

  it('lets the visitor change the choice later from the badge', async () => {
    await renderConsent();
    await userEvent.click(screen.getByRole('button', { name: 'Reject optional' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cookie settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Cookie settings' });
    const analytics = within(dialog).getByRole('switch', { name: 'Analytics' });
    expect(analytics).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(analytics);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save choices' }));
    expect(stored().choices).toEqual({ analytics: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('remembers the choice and keeps the badge off the signed-in app', async () => {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: 1, choices: { analytics: false }, decidedAt: new Date().toISOString() }));
    await renderConsent('/bookings');
    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cookie settings' })).not.toBeInTheDocument();
  });
});

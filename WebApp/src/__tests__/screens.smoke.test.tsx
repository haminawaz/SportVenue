/**
 * Renders every screen against the development mock server, signed in as the
 * seeded owner, to prove each one loads its data and reaches a ready state.
 */
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_USE_MOCKS = '1';
});

const nav = vi.hoisted(() => {
  const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() };
  return { router, params: {} as Record<string, string>, search: new URLSearchParams(), pathname: '/' };
});
vi.mock('next/navigation', () => ({
  useRouter: () => nav.router,
  useParams: () => nav.params,
  useSearchParams: () => nav.search,
  usePathname: () => nav.pathname,
}));

import { AnalyticsScreen } from '@/features/analytics/screens/AnalyticsScreen';
import { BillingScreen } from '@/features/account/screens/BillingScreen';
import { MoreScreen } from '@/features/account/screens/MoreScreen';
import { NotificationPreferencesScreen, ProfileScreen, SettingsScreen } from '@/features/account/screens/SettingsScreens';
import { BookingDetailScreen } from '@/features/bookings/screens/BookingDetailScreen';
import { BookingEditScreen } from '@/features/bookings/screens/BookingEditScreen';
import { BookingFormScreen } from '@/features/bookings/screens/BookingFormScreen';
import { BookingsScreen } from '@/features/bookings/screens/BookingsScreen';
import { RescheduleScreen } from '@/features/bookings/screens/RescheduleScreen';
import { CourtCalendarScreen } from '@/features/courts/screens/CourtCalendarScreen';
import { CourtDetailScreen } from '@/features/courts/screens/CourtDetailScreen';
import { CourtFormScreen } from '@/features/courts/screens/CourtFormScreen';
import { CourtsScreen } from '@/features/courts/screens/CourtsScreen';
import { CustomerDetailScreen } from '@/features/customers/screens/CustomerDetailScreen';
import { CustomerFormScreen } from '@/features/customers/screens/CustomerFormScreen';
import { CustomerBookingsScreen, CustomerPaymentsScreen } from '@/features/customers/screens/CustomerHistoryScreens';
import { CustomersScreen } from '@/features/customers/screens/CustomersScreen';
import { FacilityDashboardScreen } from '@/features/dashboard/FacilityDashboardScreen';
import { BusinessHoursScreen, FacilityEditScreen, FacilityScreen, FacilitySettingsScreen } from '@/features/facility/screens/FacilityScreens';
import { LandingScreen } from '@/features/marketing/screens/LandingScreen';
import { RequestDemoScreen } from '@/features/marketing/screens/RequestDemoScreen';
import { SignInScreen } from '@/features/marketing/screens/SignInScreen';
import { NotificationDetailScreen, NotificationsScreen } from '@/features/notifications/screens/NotificationScreens';
import { OpportunitiesScreen } from '@/features/opportunities/screens/OpportunitiesScreen';
import { OpportunityDetailScreen } from '@/features/opportunities/screens/OpportunityDetailScreen';
import { PaymentDetailScreen } from '@/features/payments/screens/PaymentDetailScreen';
import { PaymentsScreen } from '@/features/payments/screens/PaymentsScreen';
import { RecordPaymentScreen } from '@/features/payments/screens/RecordPaymentScreen';
import { DiscountDetailScreen, DiscountFormScreen, PricingHistoryScreen } from '@/features/pricing/screens/DiscountScreens';
import { PricingRuleScreen } from '@/features/pricing/screens/PricingRuleScreen';
import { PricingScreen } from '@/features/pricing/screens/PricingScreen';
import { useAuth } from '@/session/SessionProvider';
import { SessionProvider } from '@/session/SessionProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/ui/Toast';
import { handleMockRequest } from '@/dev/mockServer';
import type { BookingDetail, Page, Booking, OutstandingBalance, Payment } from '@/domain/types';

const TOKEN = 'mock.user_john.1';
const SLOW = { timeout: 15_000 };

function Ready({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  return status === 'signedIn' ? <>{children}</> : <span>auth:{status}</span>;
}

function Providers({ children, signedIn = true }: { children: ReactNode; signedIn?: boolean }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider scheme="light">
        <ToastProvider>
          <SessionProvider>{signedIn ? <Ready>{children}</Ready> : children}</SessionProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function show(ui: ReactNode, { params = {}, search = '', signedIn = true }: { params?: Record<string, string>; search?: string; signedIn?: boolean } = {}) {
  nav.params = params;
  nav.search = new URLSearchParams(search);
  if (signedIn) window.sessionStorage.setItem('sportvenue.accessToken', TOKEN);
  else window.sessionStorage.clear();
  return render(<Providers signedIn={signedIn}>{ui}</Providers>);
}

const api = <T,>(path: string, query: Record<string, unknown> = {}) => handleMockRequest({ method: 'GET', path, query, body: undefined, token: TOKEN }) as Promise<T>;

/** No screen may end in an error state. */
function expectNoErrors() {
  expect(screen.queryByText(/^Couldn't load|^Unable to load|^Not found$|^Something went wrong$/)).not.toBeInTheDocument();
}

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
});

describe('signed-out screens', () => {
  test('landing page', () => {
    show(<LandingScreen />, { signedIn: false });
    expect(screen.getByRole('heading', { level: 1, name: /The back office for your sports facility/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'One app for the courts, the counter and the books.' })).toBeInTheDocument();
  });

  test('log in with the seeded owner signs in', async () => {
    const user = userEvent.setup();
    show(<SignInScreen />, { signedIn: false });
    await user.click(screen.getByRole('button', { name: 'Fill in the owner account with sample data' }));
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(window.sessionStorage.getItem('sportvenue.accessToken')).toMatch(/^mock\.user_john\./), SLOW);
  });

  test('log in shows the server message for a wrong password', async () => {
    const user = userEvent.setup();
    show(<SignInScreen />, { signedIn: false });
    await user.type(screen.getByLabelText('Email'), 'john@baselinepadel.pk');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Email or password is incorrect.', undefined, SLOW)).toBeInTheDocument();
  });

  test('request demo validates, then sends', async () => {
    const user = userEvent.setup();
    show(<RequestDemoScreen />, { signedIn: false, search: 'intent=demo' });
    expect(screen.getAllByRole('heading', { name: 'Book a demo' }).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Request demo' }));
    expect(await screen.findByText('Enter your name.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Your name'), 'Mark Stevens');
    await user.type(screen.getByLabelText('Phone'), '+92 300 1234567');
    await user.type(screen.getByLabelText('Email'), 'imran@club.pk');
    await user.type(screen.getByLabelText('Facility name'), 'Smash Club');
    await user.type(screen.getByLabelText('City'), 'Lahore');
    await user.click(screen.getByRole('button', { name: 'Request demo' }));
    expect(await screen.findByText('Thanks, Mark.', undefined, SLOW)).toBeInTheDocument();
  });
});

describe('tab screens', () => {
  test('home dashboard', async () => {
    show(<FacilityDashboardScreen />);
    expect(await screen.findByText('Needs attention', undefined, SLOW)).toBeInTheDocument();
    expect(screen.getByText('Baseline Padel Club')).toBeInTheDocument();
    expectNoErrors();
  });

  test('bookings list and day schedule', async () => {
    const user = userEvent.setup();
    show(<BookingsScreen />);
    expect(await screen.findByText(/^Showing \d+ of \d+/, undefined, SLOW)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Day schedule' }));
    expect(await screen.findByRole('list', { name: 'Court 1 schedule' }, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('payments: outstanding and received', async () => {
    const user = userEvent.setup();
    show(<PaymentsScreen />);
    expect(await screen.findByText('Owed to you', undefined, SLOW)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Received' }));
    expect(await screen.findByText(/^Showing \d+ of \d+/, undefined, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('customers', async () => {
    show(<CustomersScreen />);
    expect(await screen.findByText('James Carter', undefined, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('more', async () => {
    show(<MoreScreen />);
    expect(await screen.findByText(/John Miller · Owner, Baseline Padel Club/, undefined, SLOW)).toBeInTheDocument();
  });
});

describe('bookings', () => {
  let booking: Booking;
  beforeAll(async () => {
    const page = await api<Page<Booking>>('/api/bookings', { status: 'CONFIRMED', order: 'asc', from: '2000-01-01' });
    booking = page.items.find((b) => b.paymentStatus !== 'PAID') ?? page.items[0];
  });

  test('detail', async () => {
    show(<BookingDetailScreen />, { params: { id: booking.id } });
    expect(await screen.findByText('History', undefined, SLOW)).toBeInTheDocument();
    expect(screen.getAllByText(booking.customerName).length).toBeGreaterThan(0);
    expectNoErrors();
  });

  test('edit', async () => {
    show(<BookingEditScreen />, { params: { id: booking.id } });
    expect(await screen.findByRole('button', { name: 'Save changes' }, SLOW)).toBeDisabled();
    expectNoErrors();
  });

  test('reschedule', async () => {
    show(<RescheduleScreen />, { params: { id: booking.id } });
    expect(await screen.findByText('Currently', undefined, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('new booking with a prefilled slot prices it on the server', async () => {
    const tomorrow = new Date(Date.now() + 86_400_000);
    const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const availability = await api<{ slots: { startAt: string; status: string }[] }>('/api/courts/court_2/availability', { date });
    const free = availability.slots.find((s) => s.status === 'FREE');
    show(<BookingFormScreen />, { search: free ? `courtId=court_2&date=${date}&startAt=${free.startAt}` : '' });
    expect(await screen.findByText('Court and time', undefined, SLOW)).toBeInTheDocument();
    if (free) expect(await screen.findByText('Total', undefined, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });
});

describe('courts', () => {
  test('list', async () => {
    show(<CourtsScreen />);
    expect(await screen.findByRole('link', { name: /^Court 1, Padel/ }, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('detail', async () => {
    show(<CourtDetailScreen />, { params: { id: 'court_1' } });
    expect(await screen.findByText('Revenue, last 30 days', undefined, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('calendar', async () => {
    show(<CourtCalendarScreen />, { params: { id: 'court_1' } });
    expect(await screen.findByText(/open slots? on this day|Fully booked on this day/, undefined, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('add and edit forms', async () => {
    const { unmount } = show(<CourtFormScreen />);
    expect(await screen.findByRole('button', { name: 'Add court' }, SLOW)).toBeInTheDocument();
    unmount();
    show(<CourtFormScreen />, { params: { id: 'court_1' } });
    expect(await screen.findByDisplayValue('Court 1', undefined, SLOW)).toBeInTheDocument();
  });
});

describe('customers', () => {
  test('detail, with adding a note', async () => {
    const user = userEvent.setup();
    show(<CustomerDetailScreen />, { params: { id: 'cust_1' } });
    expect(await screen.findByRole('heading', { name: 'James Carter' }, SLOW)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Add a note'), 'Smoke test note');
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    expect(await screen.findByText('Smoke test note', undefined, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('edit form', async () => {
    show(<CustomerFormScreen />, { params: { id: 'cust_1' } });
    expect(await screen.findByDisplayValue('James Carter', undefined, SLOW)).toBeInTheDocument();
  });

  test('bookings and payments history', async () => {
    const { unmount } = show(<CustomerBookingsScreen />, { params: { id: 'cust_1' } });
    expect(await screen.findByText(/^Showing \d+ of \d+/, undefined, SLOW)).toBeInTheDocument();
    unmount();
    show(<CustomerPaymentsScreen />, { params: { id: 'cust_1' } });
    expect(await screen.findByText('Total paid', undefined, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });
});

describe('payments', () => {
  test('detail', async () => {
    const page = await api<Page<Payment>>('/api/payments');
    show(<PaymentDetailScreen />, { params: { id: page.items[0].id } });
    expect(await screen.findByText(`Booking ${page.items[0].bookingReference}`, undefined, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('record a part payment', async () => {
    const user = userEvent.setup();
    const owed = await api<Page<OutstandingBalance>>('/api/payments/outstanding');
    const target = owed.items[0];
    show(<RecordPaymentScreen />, { search: `bookingId=${target.id}` });
    const amount = await screen.findByLabelText('Amount received', undefined, SLOW);
    await user.clear(amount);
    await user.type(amount, '1');
    await user.click(screen.getByRole('button', { name: 'Record payment' }));
    // Opened straight on this screen, so Back has no in-app history and returns to the booking.
    await waitFor(() => expect(nav.router.replace).toHaveBeenCalledWith(`/booking/${target.id}`), SLOW);
    const after = await api<BookingDetail>(`/api/bookings/${target.id}`);
    expect(after.paid).toBe(target.paid + 1);
  });
});

describe('pricing', () => {
  test('overview', async () => {
    show(<PricingScreen />);
    expect((await screen.findAllByText('Evening peak', undefined, SLOW)).length).toBe(2);
    expect(await screen.findByText('Student rate', undefined, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('rule, discount, discount form and history', async () => {
    let r = show(<PricingRuleScreen />, { params: { id: 'rule_1' } });
    expect(await screen.findByDisplayValue('Evening peak', undefined, SLOW)).toBeInTheDocument();
    r.unmount();
    r = show(<DiscountDetailScreen />, { params: { id: 'disc_2' } });
    expect(await screen.findByText('Code STUDENT10', undefined, SLOW)).toBeInTheDocument();
    r.unmount();
    r = show(<DiscountFormScreen />, { search: 'courtId=court_2&value=15&kind=PERCENT&weekdays=1,2,3,4,5&startTime=13:00&endTime=17:00&name=Court 2 off-peak&opportunityId=opp_1' });
    expect(await screen.findByDisplayValue('Court 2 off-peak', undefined, SLOW)).toBeInTheDocument();
    expect(screen.getByText(/Pre-filled from a revenue opportunity/)).toBeInTheDocument();
    r.unmount();
    show(<PricingHistoryScreen />);
    expect(await screen.findByText('League night', undefined, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });
});

describe('facility and account', () => {
  test('facility profile, edit, hours and settings', async () => {
    let r = show(<FacilityScreen />);
    expect(await screen.findByRole('heading', { name: 'Business hours' }, SLOW)).toBeInTheDocument();
    r.unmount();
    r = show(<FacilityEditScreen />);
    expect(await screen.findByDisplayValue('Baseline Padel Club', undefined, SLOW)).toBeInTheDocument();
    r.unmount();
    r = show(<BusinessHoursScreen />);
    expect(await screen.findByRole('button', { name: 'Copy Monday to weekdays' }, SLOW)).toBeInTheDocument();
    r.unmount();
    show(<FacilitySettingsScreen />);
    expect(await screen.findByText('Default slot length', undefined, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('settings, profile, notification preferences and billing', async () => {
    const user = userEvent.setup();
    let r = show(<SettingsScreen />);
    await user.click(await screen.findByRole('radio', { name: 'Dark' }, SLOW));
    expect(window.localStorage.getItem('sportvenue.appearance')).toBe('dark');
    r.unmount();
    r = show(<ProfileScreen />);
    expect(await screen.findByDisplayValue('John', undefined, SLOW)).toBeInTheDocument();
    r.unmount();
    r = show(<NotificationPreferencesScreen />);
    const push = await screen.findByRole('switch', { name: 'Push notifications' }, SLOW);
    expect(push).toHaveAttribute('aria-checked', 'true');
    await user.click(push);
    expect(await screen.findByText('Saved', undefined, SLOW)).toBeInTheDocument();
    r.unmount();
    show(<BillingScreen />);
    expect(await screen.findByRole('heading', { name: 'Growth' }, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });
});

describe('insights', () => {
  test('notifications list and detail', async () => {
    const r = show(<NotificationsScreen />);
    expect(await screen.findByText('Court 3 is in maintenance', undefined, SLOW)).toBeInTheDocument();
    r.unmount();
    show(<NotificationDetailScreen />, { params: { id: 'ntf_4' } });
    expect(await screen.findByRole('button', { name: 'Open court' }, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('opportunities list and detail', async () => {
    const r = show(<OpportunitiesScreen />);
    expect(await screen.findByText('Court 2 is quiet on weekday afternoons', undefined, SLOW)).toBeInTheDocument();
    r.unmount();
    show(<OpportunityDetailScreen />, { params: { id: 'opp_1' } });
    expect(await screen.findByRole('button', { name: 'Create this discount' }, SLOW)).toBeInTheDocument();
    expectNoErrors();
  });

  test('analytics', async () => {
    show(<AnalyticsScreen />);
    const section = await screen.findByRole('heading', { name: 'Peak and off-peak hours' }, SLOW);
    expect(section).toBeInTheDocument();
    expect(within(document.body).getByText('Revenue by court')).toBeInTheDocument();
    expectNoErrors();
  });
});

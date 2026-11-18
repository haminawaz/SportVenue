import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiRequest, ApiError } from '@/api/client';
import type { Analytics } from '@/domain/types';
import { addDays, startOfWeek, todayIn } from '@/lib/datetime';
import { SessionProvider } from '@/session/SessionProvider';
import type { Session } from '@/session/types';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/ui/Toast';

import { FacilityDashboardScreen } from '../FacilityDashboardScreen';
import type { DateRange } from '../types/facilityDashboard.types';
import { calendarPeriodEnd, comparisonFor } from '../utils/dashboardFormatters';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }), usePathname: () => '/' }));

vi.mock('@/api/client', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/client')>()), apiRequest: vi.fn() }));
const request = vi.mocked(apiRequest);

const TZ = 'America/Chicago';
function makeSession(): Session {
  return {
    user: { id: 'u1', firstName: 'John', lastName: 'Miller', email: 'john@example.com', role: 'OWNER' },
    facility: { id: 'fac_1', name: 'Baseline Padel Club', timezone: TZ, currency: 'USD' },
  };
}

function makeAnalytics(startDate: string, endDate: string): Analytics {
  return {
    period: { startDate, endDate },
    currency: 'USD',
    revenue: { total: 24500, changePercent: 12, byDay: [{ date: endDate, amount: 24500 }] },
    bookings: { total: 18, changePercent: -5, averagePerDay: 18, averageValue: 1361 },
    utilization: { overall: 72, byCourt: [{ courtId: 'court_1', courtName: 'Court 1', utilization: 72 }] },
    revenueByCourt: [{ courtId: 'court_1', courtName: 'Court 1', amount: 24500 }],
    customers: { active: 12, new: 2, returning: 10, top: [{ customerId: 'cus_1', name: 'James Carter', spent: 9000, bookings: 3 }] },
    outstanding: { total: 8500, bookingCount: 4, aging: [{ label: '0-7 days', amount: 8500 }] },
    cancellations: { count: 1, rate: 5, noShows: 0, reasons: [] },
    peakHours: [{ weekday: 1, hour: 19, utilization: 90 }, { weekday: 2, hour: 10, utilization: 10 }],
  };
}

function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }));
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider scheme="light">
        <ToastProvider>
          <SessionProvider initialSession={makeSession()}>{children}</SessionProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const renderDashboard = () => render(<FacilityDashboardScreen />, { wrapper: Providers });
const lastQuery = () => (request.mock.calls.at(-1)?.[1] as { query: { startDate: string; endDate: string } }).query;
/** The query the dashboard sends for a period: the period, the rest of it for the chart, and what it is compared with. */
const query = (preset: DateRange['preset'], startDate: string, endDate: string, aheadUntil?: string) => {
  const c = comparisonFor({ preset, startDate, endDate });
  return { startDate, endDate, aheadUntil, compareStartDate: c.startDate, compareEndDate: c.endDate };
};
/** The default period: this week so far, against the same days last week. */
const thisWeek = () => {
  const today = todayIn(TZ);
  const sunday = addDays(startOfWeek(today), 6);
  return query('this_week', startOfWeek(today), today, sunday > today ? sunday : undefined);
};
/** Matches an amount exactly, whether the formatter used a normal or a non-breaking space. */
const money = (s: string) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[ \\u00a0]')}$`);

beforeEach(() => {
  vi.clearAllMocks();
  request.mockImplementation(async (_path, opts) => {
    const q = (opts as { query: { startDate: string; endDate: string } }).query;
    return makeAnalytics(q.startDate, q.endDate);
  });
});

test('greets the owner for the time of day, with the facility and period', async () => {
  renderDashboard();
  expect(screen.getByRole('heading', { level: 1, name: /^Good (morning|afternoon|evening|night), John$/ })).toBeInTheDocument();
  expect(screen.getByText('Baseline Padel Club')).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'Revenue over time' })).toBeInTheDocument();
});

test('shows the full report for this week in the facility zone by default', async () => {
  renderDashboard();
  expect(await screen.findByRole('heading', { name: 'Peak and off-peak hours' })).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith('/api/analytics', { query: thisWeek() });
  for (const heading of ['Revenue by court', 'Court utilization', 'Customers', 'Outstanding payments', 'Cancellations']) {
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  }
  expect(screen.getAllByText(money('$24,500')).length).toBeGreaterThan(0);
  expect(screen.getByText('+12% vs previous period')).toBeInTheDocument();
});

test('changing the period reloads the report for the new dates', async () => {
  const user = userEvent.setup();
  renderDashboard();
  await screen.findByRole('heading', { name: 'Revenue over time' });
  await user.click(screen.getByRole('radio', { name: 'This month' }));
  const today = todayIn(TZ);
  const monthEnd = calendarPeriodEnd('this_month', today)!;
  await vi.waitFor(() => expect(lastQuery()).toEqual(query('this_month', `${today.slice(0, 8)}01`, today, monthEnd > today ? monthEnd : undefined)));
});

const dayName = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

/** Clicks a day on the open range calendar, paging months until it is shown. */
async function pickDay(user: ReturnType<typeof userEvent.setup>, date: string) {
  const name = new RegExp(`^${dayName.format(new Date(`${date}T00:00:00Z`))}(,|$)`);
  for (let i = 0; i < 24; i++) {
    const day = screen.queryByRole('button', { name });
    if (day) return user.click(day);
    const shown = document.querySelector('[data-date]')?.getAttribute('data-date') ?? '';
    await user.click(screen.getByRole('button', { name: date < shown ? 'Previous month' : 'Next month' }));
  }
  throw new Error(`No day button for ${date}`);
}

test('a custom range is picked on the calendar and loads once applied', async () => {
  const user = userEvent.setup();
  renderDashboard();
  await screen.findByRole('heading', { name: 'Revenue over time' });
  const today = todayIn(TZ);
  const start = addDays(today, -40);
  await user.click(screen.getByRole('button', { name: 'Custom range' }));
  expect(screen.getByRole('dialog', { name: 'Pick a date range' })).toBeInTheDocument();
  await pickDay(user, start);
  expect(screen.getByText(/Now pick the last day.$/)).toBeInTheDocument();
  await pickDay(user, today);
  expect(screen.getByText(/· 41 days$/)).toBeInTheDocument();
  // Nothing reloads until Apply.
  expect(lastQuery()).toEqual(thisWeek());
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  await vi.waitFor(() => expect(lastQuery()).toEqual(query('custom', start, today)));
  expect(screen.queryByRole('dialog', { name: 'Pick a date range' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Custom range, .+. Change$/ })).toHaveFocus();
});

test('days after today cannot be picked', async () => {
  const user = userEvent.setup();
  renderDashboard();
  await screen.findByRole('heading', { name: 'Revenue over time' });
  await user.click(screen.getByRole('button', { name: 'Custom range' }));
  const today = todayIn(TZ);
  expect(screen.getByRole('button', { name: /, today$/ })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  const tomorrow = document.querySelector(`[data-date="${addDays(today, 1)}"]`);
  if (tomorrow) expect(tomorrow).toBeDisabled();
});

test('a custom range longer than a year is refused with a reason', async () => {
  const user = userEvent.setup();
  renderDashboard();
  await screen.findByRole('heading', { name: 'Revenue over time' });
  const today = todayIn(TZ);
  await user.click(screen.getByRole('button', { name: 'Custom range' }));
  await pickDay(user, addDays(today, -400));
  await pickDay(user, today);
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Pick a range of one year or less.');
  expect(lastQuery()).toEqual(thisWeek());
});

test('Clear empties the picked days, and an applied custom range goes back to this week', async () => {
  const user = userEvent.setup();
  renderDashboard();
  await screen.findByRole('heading', { name: 'Revenue over time' });
  const today = todayIn(TZ);
  await user.click(screen.getByRole('button', { name: 'Custom range' }));
  expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  await pickDay(user, addDays(today, -10));
  await pickDay(user, addDays(today, -2));
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  await vi.waitFor(() => expect(lastQuery()).toEqual(query('custom', addDays(today, -10), addDays(today, -2))));

  await user.click(screen.getByRole('button', { name: /^Custom range, / }));
  await user.click(screen.getByRole('button', { name: 'Clear' }));
  // Back on this week (its report is already cached, so nothing new is fetched).
  expect(screen.getByRole('radio', { name: 'This week' })).toBeChecked();
  expect(screen.getByRole('button', { name: 'Custom range' })).toBeInTheDocument();
  expect(screen.getByText('Pick the first day.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  expect(document.activeElement).toHaveAttribute('data-date');
});

test('Escape closes the calendar without changing the period', async () => {
  const user = userEvent.setup();
  renderDashboard();
  await screen.findByRole('heading', { name: 'Revenue over time' });
  await user.click(screen.getByRole('button', { name: 'Custom range' }));
  await pickDay(user, addDays(todayIn(TZ), -3));
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog', { name: 'Pick a date range' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Custom range' })).toHaveFocus();
  expect(lastQuery()).toEqual(thisWeek());
});

test('Revenue over time has no table toggle', async () => {
  renderDashboard();
  await screen.findByRole('heading', { name: 'Revenue over time' });
  expect(screen.queryByRole('button', { name: /Show as table|Show chart/ })).not.toBeInTheDocument();
});

test('an error offers a retry, then the report recovers', async () => {
  const user = userEvent.setup();
  request.mockRejectedValueOnce(new ApiError(503, 'Service unavailable'));
  renderDashboard();
  await user.click(await screen.findByRole('button', { name: /try again/i }));
  expect(await screen.findByRole('heading', { name: 'Revenue over time' })).toBeInTheDocument();
});

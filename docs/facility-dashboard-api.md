# Facility dashboard: API contract and open decisions

The owner dashboard screen (`src/screens/facility-dashboard`) was built without access to the
SportVenue sports-facility backend. Everything below is a **proposal** the mobile client is coded
against. Confirm or correct each item with the backend team; the mobile changes are isolated to
the files listed.

## Endpoints

| Purpose | Proposed route | Mobile file |
|---|---|---|
| Dashboard data | `GET /api/owner/dashboard?facilityId&startDate&endDate` | `services/facilityDashboardService.ts` |
| Payment reminder | `POST /api/bookings/{bookingId}/payment-reminders` | same |

- Dates are `YYYY-MM-DD` calendar dates **in the facility's timezone**, inclusive.
- The request is authorised by the access token. `facilityId` only selects context; the backend
  must reject facilities the user cannot access (403) or that no longer exist (404).
- 422 `message` values are shown to the user as-is, so they must be user-facing copy.
- The dashboard response is treated as atomic: one failure shows one error state.

## Response shape

As in the implementation plan (section 18), with these additions the client relies on:

| Field | Why |
|---|---|
| `capabilities.paymentReminders: boolean` | The Remind button only appears when this is `true` **and** the user has `payment.remind`. Absent = hidden. |
| `summary.utilization.changePercent?` | Optional trend on the utilization card. |
| `opportunities[].courtName?`, `bookingId?`, `customerId?` | Needed to label and route opportunity actions. Actions appear only when the ID is present. |
| `recentBookings[]` as `{ bookingId, customerName, courtName, startAt, endAt, amount, status }` | The plan left this array empty. |

Conventions:

- Money is in **major units** of `currency` (24500 = Rs 24,500). If the backend uses minor units,
  convert once in the service, not in components.
- Timestamps **without** an offset are read as facility-local wall time; timestamps **with** an
  offset or `Z` are converted into `session.facility.timezone`.
- Unknown `opportunities[].type` values render as a generic card (title and description, no
  invented actions). Unknown `recommendedAction.type` values show no suggestion line.
- All figures (revenue, utilization, outstanding, trends, recommendations) come from the backend.
  The client formats but never calculates them.

## Session (not built here)

`src/app/index.tsx` has a `TODO(auth)`. The real session must provide the signed-in user, the
active facility (`id`, `name`, IANA `timezone`, ISO `currency`). SportVenue has a single role,
the facility owner, so there are no client-side permissions: every signed-in screen and action is
available, and the backend authorises each request against the access token.
It should also call `configureApiAuth()` (`src/api/client.ts`) with the token getter and 401 handler.

## Navigation (not built here)

`src/navigation/dashboardDestinations.ts` returns `null` for every destination (court day, booking
detail, customer detail, new booking), so buttons show "not available in this build yet". Return
each screen's `Href` there once it exists; nothing else changes.

## Assumptions to confirm

1. Date filter allows past and present only, max 31 days (`RANGE_RULES` in `utils/dashboardFormatters.ts`).
2. Weeks start on Monday.
3. Stale time is 60 seconds; the dashboard refetches on return to the app once stale, on pull,
   on period change, and after a successful reminder.
4. "Custom date" is a single day. A multi-day custom range needs a range picker component.
5. There is no multi-facility switcher; the facility comes from the session.
6. There is no offline cache. If a refresh fails but data was already loaded, the screen keeps it and
   shows "Couldn't refresh. Showing data from {time}."

## Running locally

```bash
npm start            # .env.development sets EXPO_PUBLIC_USE_MOCKS=1 (dev builds only)
npm test
npm run typecheck
npm run lint
```

The mock (`src/dev/`) is loaded only when `__DEV__` **and** `EXPO_PUBLIC_USE_MOCKS=1`, so a
production build cannot read it.

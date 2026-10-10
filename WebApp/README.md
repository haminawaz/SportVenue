# SportVenue (web)

The SportVenue owner app for the browser, built with Next.js. It is a port of the Expo app in `../MobileApp`, with the same screens, routes, API contract and business rules.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

`NEXT_PUBLIC_USE_MOCKS=1` enables the in-browser mock server (`src/dev/mockServer`). On the log-in screen, the demo buttons fill in a sample owner:

- Seeded facility: `john@baselinepadel.pk` / `sportvenue123`
- Empty facility: `emma@greenlinearena.pk` / `sportvenue123`

Mock data lives in memory and resets when the page reloads. Deployments (such as Vercel preview/demo) automatically default to mock mode when no `NEXT_PUBLIC_API_URL` is configured. When connecting to a live backend, specify `NEXT_PUBLIC_API_URL`.

## Checks

```bash
npm run lint
npm run typecheck
npm test           # Vitest: mock server, formatters, dashboard and a smoke test of every screen
npm run build
```

## Layout

- `app/`: routes only. `(app)` holds the signed-in screens, `(public)` the marketing page, log in and get started. Each page renders one screen from `src/features`.
- `src/features/<area>/`: screens, components and the API hooks for each area.
- `src/ui/`: shared UI kit. `src/theme`, `src/lib`, `src/api`, `src/session`, `src/navigation`: shared infrastructure.

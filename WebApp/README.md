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

Mock data lives in memory and resets when the page reloads. In mock mode nothing leaves the browser: the "Get started" form says so and does not promise a reply.

## Environment variables

Only `NEXT_PUBLIC_*` variables reach the browser, so none of them may hold a secret. `.env.development` and `.env.production` are committed and hold public defaults only; put anything private in `.env*.local` (git-ignored) or the host's settings.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the live SportVenue API. Empty means mock mode. Also added to the CSP `connect-src`. |
| `NEXT_PUBLIC_USE_MOCKS` | `1` forces the mock server, `0` forces the live API. Defaults to mocks when no API URL is set. |
| `NEXT_PUBLIC_SITE_URL` | The production address, for example `https://example.com`. **Required before launch**: canonical URLs, the sitemap, Open Graph images, JSON-LD and `llms.txt` links are absolute only once it is set. On Vercel, `VERCEL_PROJECT_PRODUCTION_URL` is used when it is missing. |

## Checks

```bash
npm run lint
npm run typecheck  # generates Next's route types first, so it works on a fresh clone
npm test           # Vitest: mock server, consent, legal content, auth gate, formatters, and a smoke test of every screen
npm run build
```

## Legal pages and cookie consent

- `/privacy`, `/terms` and `/cookies` render `src/features/legal/content.ts`. The mobile app shows the same text; keep `MobileApp/src/features/legal/content.ts` identical.
- The operator's legal name, address, contact email, governing law, EU/UK representative and service providers live in `src/config/legal.ts`. **Fill them in before launch.** Until then the pages show a "Draft" note and mark each missing detail as pending.
- The policies were drafted from what the app actually collects and stores. Have a qualified lawyer review them before launch.
- The cookie banner (`src/features/legal/CookieConsent.tsx`) stores the visitor's choice for 12 months. The site sets no cookies and loads no third-party scripts. **Any analytics or other optional tool added later must check `hasConsent('analytics')` from `src/lib/consent.ts` before it runs**, be listed in the Cookie Policy, and be allowed in the CSP in `next.config.ts`.

## SEO and security

- Metadata, canonical URLs and share images are set per page; shared Open Graph fields come from `src/config/site.ts`. `app/robots.ts`, `app/sitemap.ts` and `app/llms.txt/route.ts` list the public pages (`PUBLIC_PATHS`). The signed-in app is `noindex`.
- Public pages render their full content in the prerendered HTML. `AuthGate` only redirects a signed-in owner once the session is known.
- Security headers, including a Content-Security-Policy, are set in `next.config.ts`. Production source maps are not published.

## Layout

- `app/`: routes only. `(app)` holds the signed-in screens, `(public)` the marketing page, log in and get started; `privacy`, `terms` and `cookies` are readable signed in or out. Each page renders one screen from `src/features`.
- `src/features/<area>/`: screens, components and the API hooks for each area. `src/features/legal`: policy text, consent banner and legal pages.
- `src/ui/`: shared UI kit. `src/theme`, `src/lib`, `src/api`, `src/session`, `src/navigation`, `src/config`: shared infrastructure.

# SportVenue (mobile)

The SportVenue owner app for iOS and Android, built with Expo (SDK 57) and Expo Router. The web app in `../WebApp` is a port of it, with the same screens, routes, API contract and business rules.

## Run it

```bash
npm install
npx expo start     # then open in Expo Go, a simulator, or press w for the browser
```

With mocks on, the app runs on the seeded demo data in `src/dev/mockServer`. On the log-in screen, the demo buttons fill in a sample owner:

- Seeded facility: `john@baselinepadel.pk` / `sportvenue123`
- Empty facility: `emma@greenlinearena.pk` / `sportvenue123`

In mock mode nothing leaves the device: the "Get started" form says so and does not promise a reply.

## Environment variables

Everything in an `EXPO_PUBLIC_*` variable is bundled into the app, so none of them may hold a secret. `.env.development` and `.env.production` are committed and hold public defaults only.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Base URL of the live SportVenue API. Empty means mock mode. |
| `EXPO_PUBLIC_USE_MOCKS` | `1` forces the demo data, `0` forces the live API. Defaults to mocks when no API URL is set. |

**Before a real release:** every EAS profile in `eas.json` (development, preview and production) sets `EXPO_PUBLIC_USE_MOCKS=1`. A store build that should talk to the live backend needs `EXPO_PUBLIC_API_URL` set and `EXPO_PUBLIC_USE_MOCKS=0` in its profile.

## Checks

```bash
npm run lint
npm run typecheck
npm test            # Jest: mock server, consent, legal content, formatters, dashboard
npx expo-doctor     # SDK and dependency compatibility
```

Add or upgrade packages with `npx expo install <package>` so versions match the SDK.

## Legal pages and privacy choices

- The Privacy Policy, Terms and Conditions and Cookie Policy (`/privacy`, `/terms`, `/cookies`) render `src/features/legal/content.ts`, the same text as the web app. Keep it identical to `WebApp/src/features/legal/content.ts`.
- The operator's details live in `src/config/legal.ts` (identical to the web copy). **Fill them in before launch.** Until then the screens show a "Draft" note and mark each missing detail as pending. Have a qualified lawyer review the text.
- "Privacy choices" (`src/features/legal/PrivacyChoices.tsx`) asks once, stores the choice in the device's secure storage for 12 months, and offers a floating badge on the signed-out screens and a row in Settings to change it. **Any analytics or other optional SDK added later must check `hasConsent('analytics')` from `src/lib/consent.ts` before it starts**, and must be listed in the Cookie Policy.
- The App Store and Google Play ask for a privacy policy URL. Use the web app's `/privacy` once the site is live.

## Layout

- `src/app/`: routes only (Expo Router). `(app)` holds the signed-in screens; `welcome`, `sign-in`, `request-demo` and `forgot-password` are for signed-out visitors; `reset-password`, `privacy`, `terms` and `cookies` work either way.
- `src/features/<area>/`: screens, components and the API hooks for each area.
- `src/ui/`: shared UI kit. `src/theme`, `src/lib`, `src/api`, `src/session`, `src/navigation`, `src/config`: shared infrastructure.

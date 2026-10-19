# SportVenue

Monorepo with two client apps for court venues (padel, tennis, futsal, squash): bookings, payments, customers, pricing.

| App | Stack | Verify with |
| --- | --- | --- |
| `WebApp/` | Next.js 16 (App Router), React 19, Tailwind 4, TanStack Query, Vitest | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` |
| `MobileApp/` | Expo SDK 57, Expo Router (`src/app/`), React Native, TanStack Query, Jest | `npm run lint`, `npm run typecheck`, `npm test`, `npx expo-doctor` |

Each app has its own `CLAUDE.md` → `AGENTS.md`. Read it before touching that app; framework versions there are newer than training data.

- **There is no backend in this repo.** Both apps call an external API through `src/api/client.ts` (`NEXT_PUBLIC_API_URL` on web). With no API URL set, the web app runs on the seeded mock server in `WebApp/src/dev/mockServer/`.
- Public site details (name, description, site URL, indexable paths) live in `WebApp/src/config/site.ts`. The site URL comes from `NEXT_PUBLIC_SITE_URL` and is never hard-coded.
- Legal pages (`/privacy`, `/terms`, `/cookies`) render `src/features/legal/content.ts`, which must stay identical in both apps. Operator details (legal name, address, contact email, governing law, providers) live in `src/config/legal.ts` in each app and are still pending: never fill them with guesses.
- No analytics or tracking exists. Any optional tool added later must check `hasConsent('analytics')` from `src/lib/consent.ts` (both apps) before it runs, and must be listed in the Cookie Policy.

## Rules

- `.claude/rules/frontend.md`: UI, responsiveness, accessibility, SEO, content, privacy UX, performance, design.
- `.claude/rules/backend.md`: API layer, secrets, auth, security, data protection, payments, production config.

Apply these standards to any code you write or change. Run a full audit only when the user asks for one (see **Audits**).

## Working principles

- Inspect the actual framework, routes, components, config and existing behavior before changing anything. Follow existing conventions.
- Preserve the existing design, branding, working functionality, security, performance and SEO. No unnecessary rewrites or new dependencies. Refactor incrementally.
- Fix confirmed issues directly in code. Don't stop at recommendations, and don't stop after the homepage: cover every page and screen.
- Verify every fix. Run the available lint, typecheck, tests and production build. Never claim a fix works or a test passed unless it was actually run.
- Never invent URLs, domains, business details, contact information, credentials, certifications, reviews, ratings, legal requirements or compliance claims. Never pretend an external service (API, email, analytics, payments, domain, backups) is configured. Ask for missing information instead.
- Never delete code or change behavior without understanding its purpose.
- Never expose, print, commit or transmit secrets. Refer to them by location and type only.
- No destructive commands, production changes or live payments without explicit authorization. If a change could break things, state the risk and keep a rollback path.
- Don't promise perfect security or legal compliance. Flag anything that needs qualified legal review or manual action.

## Audits

These six audits are saved for later. Run one only when asked (e.g. "run the security audit"). Before any audit, read both rule files in full. Then work through the matching checklist across the whole project: inspect, fix confirmed issues, verify, report.

Every audit report marks each checklist item with exactly one status: **PASS**, **FIXED**, **NEEDS REVIEW**, **BLOCKED** or **NOT APPLICABLE**. Every report also lists issues found, fixes applied, files changed, tests run with their actual results, and remaining problems. Anything blocked by missing credentials, access or backend code is reported as BLOCKED, never assumed.

1. **Site QA audit.** Responsive layout, links, mobile nav, favicon/logo, SEO metadata, 404 page, copyright year, images, forms, placeholder content, `tel:`/`mailto:`, accessibility, console errors, basic security. Test at 320, 375, 768, 1024 and 1440px. Run link checks and browser tests where available.
2. **Privacy & compliance audit.** Legal pages, cookie consent, form consent, data minimization, third-party SDKs/tracking, dark patterns, accessibility, business disclosures, children's data, unsubscribe, asset licenses, data-subject requests, retention and sharing. Work out which laws apply from the audience, locations and business model, and ask when unknown. Draft policies from the site's actual data practices, not templates. Extra report sections: privacy and third-party tracking findings; consent, unsubscribe and deletion workflow test results; missing business information and legal questions; remaining risks needing legal review.
3. **Security audit.** Every item in the security sections of `backend.md`. Use only authorized, non-destructive tests. Extra report sections: vulnerabilities by severity (Critical / High / Medium / Low); exposed secrets by location and type only; credentials needing rotation or revocation; deployment steps. End with a readiness verdict: *Ready for deployment*, *Ready after manual review* or *Not ready for deployment*.
4. **Production polish & SEO audit.** Domain/URLs/redirects, 404, breadcrumbs, internal links, titles, meta, canonicals, H1s, sitemap, robots, `llms.txt`, structured data, icons, Open Graph, alt text, branding, bundle size, source maps, assets, layout shift, design consistency. Report anything that needs domain access or manual configuration.
5. **Pre-launch audit.** Mobile, links, forms, performance, HTTPS/mixed content, Chrome + Safari, content/spelling, WhatsApp button and share preview, domain email, Google Analytics + Search Console + sitemap indexing, backups + recovery docs, and the payment flow in sandbox (success, failure, cancel, duplicate submit). Allowed statuses: PASS, FIXED, NEEDS REVIEW or BLOCKED. List the remaining launch blockers. Recommend launch only when the critical issues are resolved and verified.
6. **Architecture audit.** Folder structure; separation of business logic, API calls and UI; duplicate and dead code; unused dependencies; naming; error handling; config in env; reusable components without needless abstraction; state management; docs for setup, env vars, APIs and business logic; API structure. Allowed statuses: PASS, FIXED, NEEDS REVIEW or BLOCKED. Confirm existing features still work after refactoring.

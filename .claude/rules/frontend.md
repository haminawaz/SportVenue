---
paths:
  - "WebApp/app/**"
  - "WebApp/src/**"
  - "WebApp/public/**"
  - "MobileApp/src/**"
  - "MobileApp/assets/**"
  - "MobileApp/app.json"
---

# Frontend rules (WebApp + MobileApp UI)

Items marked **(web)** apply only to `WebApp/`. Everything else applies to both apps. On mobile, "page" means "screen".

## Responsive layout

- No horizontal scrolling or overflow on any page. Check long words, wide tables, fixed widths, images and absolutely positioned elements.
- Every page must work on mobile, tablet and desktop. Test at 320, 375, 768, 1024 and 1440px. No broken or awkward breakpoints.
- The mobile navigation menu must be responsive and accessible: keyboard operable, focus managed, correct ARIA state, closes on navigation.
- **(web)** Must work in Chrome and Safari.

## Navigation and links

- No broken internal, external, footer or navigation links. Remove dead links and unused nav items.
- The logo links to the home page.
- **(web)** A custom, responsive 404 page (`app/not-found.tsx`) with working navigation back home.
- URL slugs are clean, descriptive and lowercase. When a URL changes, add a redirect from the old one to keep its SEO value.
- Add relevant internal links, and breadcrumbs where they help navigation.
- Phone numbers use `tel:` and emails use `mailto:` (on mobile, open them via `Linking`).
- A WhatsApp chat button, if present, must use the real number and prefilled message. Never invent a number.

## Forms and interactive elements

- Every button, form and interactive element must work.
- Validate on the client and show clear success and error messages. Show server field errors too (`ApiError.fieldErrors` from a 422).
- Guard against duplicate submissions (disable while pending).
- Ask only for the data that's needed.
- Consent checkboxes are explicit and never preselected for optional purposes such as marketing.

## Accessibility

- Full keyboard navigation with visible focus and a logical tab order.
- Informative images get meaningful alt text. Decorative images get empty `alt=""`. On mobile, use `accessibilityLabel` and mark decorative images hidden.
- Text and UI color contrast must meet WCAG AA.
- Use semantic elements and labelled form controls. Announce errors to assistive tech.

## SEO and metadata (web)

- Every indexable page has a unique, descriptive `<title>` and meta description, plus a correct canonical URL.
- One clear H1 per page with a logical heading hierarchy.
- `sitemap.xml` (`app/sitemap.ts`) and `robots.txt` (`app/robots.ts`) must be generated and correct. Keep `PUBLIC_PATHS` in `src/config/site.ts` in sync with the public routes.
- Indexing directives must be right: public pages discoverable, authenticated app pages `noindex`.
- `llms.txt` is optional and is not a guaranteed ranking factor.
- Add structured data only when it's accurate, and validate it. Use `LocalBusiness` only with real business details. Never invent ratings, reviews or addresses.
- Favicon, Apple and mobile icon metadata, and Open Graph / social share images (with alt text) must be in place.
- The browser tab shows the SportVenue brand name, never Vite, React, Next.js or other template branding.
- The site URL comes from env (`NEXT_PUBLIC_SITE_URL`). Never hard-code a domain.

## Content and branding

- No placeholder text, lorem ipsum, dummy content, unfinished sections or development-only UI in production.
- Fix spelling and grammar.
- The copyright year updates automatically (computed, not hard-coded).
- Use the existing brand identity consistently. Replace generic branding.
- No dark patterns, misleading pricing, hidden fees, fake reviews, fake testimonials or unsupported claims.
- Business details, contact info and legal disclosures must be real and verified. Ask when they're unknown.

## Privacy UX and consent

- Legal pages: Privacy Policy and Terms of Service, plus Refund and Cookie policies where applicable. Draft them from the site's actual data practices and flag them for qualified legal review. Never claim compliance without evidence.
- Use a cookie consent banner with accept, reject and customize options where nonessential cookies or tracking exist. Reject must be as easy as accept.
- Load no nonessential analytics, tracking or marketing scripts before the required consent. Users can change or withdraw consent later, and that choice is respected.
- Audit every third-party SDK, analytics tool, tracking script, cookie and external integration. Remove what isn't needed.
- Add age verification or parental consent where children's data is legally involved.
- Fonts, images, icons and other assets must have appropriate licenses.

## Performance and code quality

- No console errors, failed asset requests, failed network calls or relevant warnings.
- Compress and right-size images without visible quality loss. Use the framework image components. Optimize fonts and other assets.
- Keep bundles small: code-split and lazy-load heavy parts (e.g. the three.js court scene), and remove unused dependencies.
- Avoid layout shift (reserve media dimensions), unnecessary re-renders and avoidable requests.
- **(web)** Don't publicly expose production source maps unless monitoring needs them, and restrict them if so.
- Remove dead code and dev-only dependencies where safe.

## Design consistency

- Spacing, typography, colors, alignment and component styling are consistent across all pages.
- Improve visual hierarchy without changing the brand. No unnecessary redesigns.

## Structure

- Keep business logic, API calls and UI separate. Screens and hooks never call `fetch()` directly. Feature services call `apiRequest()` from `src/api/client.ts`.
- Make components reusable and modular without unnecessary abstraction. Keep state management simple.
- Use consistent naming that follows each app's existing conventions.

## Analytics and Google (web)

- Google Analytics, Search Console and sitemap submission need real account access. Verify them when access exists. Otherwise report BLOCKED and never assume they're set up.

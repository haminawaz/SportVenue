---
paths:
  - "**/src/api/**"
  - "**/src/session/**"
  - "**/src/config/**"
  - "WebApp/src/dev/**"
  - "WebApp/app/**/route.ts"
  - "WebApp/proxy.ts"
  - "WebApp/next.config.ts"
  - "**/.env*"
  - "**/.gitignore"
  - "MobileApp/app.json"
  - "MobileApp/eas.json"
  - "**/package.json"
---

# Backend, security and data rules

**The API server is not in this repo.** Both apps are clients of an external API (`src/api/client.ts`). The web app falls back to the mock server in `WebApp/src/dev/mockServer/` when `NEXT_PUBLIC_API_URL` is unset.

Server-side items below (database, password hashing, CORS, rate limiting, CSRF, email sending, data retention) apply to that external backend, or to server code added here later: route handlers, `proxy.ts`, server actions. When auditing, mark them BLOCKED or NOT APPLICABLE unless the code is available. Never invent backend services. The client-side items always apply.

## Secrets and environment variables

- Only public values go in client code. On the web, only `NEXT_PUBLIC_*` vars reach the browser. On mobile, everything bundled is public. Server secrets never appear in frontend code, client bundles or build output.
- `.env.development` and `.env.production` are committed on purpose (see `.gitignore`), so they may hold only non-secret public config. Real secrets go in `.env*.local` (ignored), the hosting provider's env settings, EAS secrets or a secret manager.
- When auditing, check `.env` files, config files, build outputs, `.gitignore` and the full git history for leaked keys, tokens, passwords and credentials.
- Report a leaked secret by location and type only, never by its value. Recommend immediate rotation or revocation. Explain how to purge it from history safely (e.g. `git filter-repo`, then force-push and re-clone) without running destructive commands unasked.

## Authentication and sessions

- Use established libraries for login, logout, session management and account recovery. Never invent your own crypto or auth.
- Hash passwords with Argon2id (or another current secure algorithm). Never store or log plaintext passwords.
- Sessions expire, are invalidated on logout and on password reset, and cookies are `Secure`, `HttpOnly` and `SameSite` as appropriate.
- Protect state-changing requests against CSRF when using cookie auth.
- Store tokens client-side only through the session layer (`src/session/tokenStorage.ts`). On mobile, keep them in `expo-secure-store`. On 401, sign the user out via `onUnauthorized`.

## Authorization

- Enforce role-based access control on the server for admin routes, APIs and sensitive resources. Client-side route guards are UX only.
- Users must never reach another user's or another venue's data (no IDOR). Test cross-user access explicitly.

## Input and API security

- Validate and sanitize all input at the server boundary. Prevent XSS, SQL injection, command injection, path traversal and unsafe file uploads (check type, size and storage location).
- Never render untrusted HTML (`dangerouslySetInnerHTML`) without sanitizing it.
- Every endpoint needs authentication, authorization, input validation, safe error handling and rate limiting where appropriate.
- Organize endpoints, validation, auth and error responses in a consistent, scalable structure. Errors are meaningful to users but never leak stack traces, SQL or internals.
- On the client, map failures to `ApiError` / `NetworkError` from `src/api/client.ts` and show a meaningful message.

## CORS and security headers

- CORS allows only trusted origins, methods and headers. No `*` or credentialed wildcards without written justification.
- Web headers (`next.config.ts` or the host config): Content-Security-Policy, Strict-Transport-Security, `X-Content-Type-Options: nosniff`, clickjacking protection (`frame-ancestors` / `X-Frame-Options`), Referrer-Policy and Permissions-Policy. Test that the CSP doesn't break the app.
- HTTPS everywhere: valid SSL, HTTP→HTTPS redirects, no mixed content.

## Database

- Use parameterized queries or safe ORM methods only, with least-privilege DB accounts, TLS connections and proper access controls.

## Abuse protection

- Rate limiting, login throttling, request size limits, and protection against brute force and resource exhaustion.

## Logging and monitoring

- Log relevant security events (auth failures, permission denials, password resets) without passwords, tokens or sensitive personal data.
- The API client never logs requests, headers, tokens or response bodies. Keep it that way.

## Production configuration and exposed files

- Production has debug mode, verbose errors, dev endpoints, unnecessary services and insecure defaults turned off.
- Mocks turn on automatically when `NEXT_PUBLIC_API_URL` is unset (meant for demos). Before a real launch, confirm production points at the live API with mocks off.
- Nothing sensitive is publicly reachable: `.env`, source maps, backups, logs, `.git`, database dumps, config files, private uploads.
- File, database and backup permissions follow least privilege. Protect sensitive operations, backups and uploads.

## Dependencies

- Run `npm audit`, update vulnerable or outdated packages safely, remove unused dependencies and review the lockfiles.
- MobileApp: add or upgrade packages with `npx expo install` (SDK-compatible versions), then run `npx expo-doctor`.

## Privacy and data protection

- Collect, store and return only the data that's needed. Never expose unnecessary sensitive information in API responses.
- Data access, correction and deletion requests go through a secure process that verifies identity, so nobody can request deletion of someone else's data.
- Consent preferences are stored and respected server-side. Users can change or withdraw them.
- Data retention periods, security measures and third-party sharing must be defined and match the privacy notice.
- Every marketing email has a working unsubscribe link that's honored. Review email templates for this.
- Never claim legal compliance without evidence. Flag items for qualified legal review.

## Payments

- Test only in sandbox: success, failure, cancellation and duplicate submissions (idempotency keys or server-side dedupe).
- Never run live payments without explicit authorization. Never store raw card data.
- Don't show misleading prices or hidden fees. Totals shown must match what's charged.

## Operations

- Backups must be configured, and recovery steps documented. Verify, don't assume.
- Set up domain email, DNS and the custom domain only when credentials and provider access are available. Otherwise report BLOCKED.

## Architecture and docs

- Config and secrets live in environment variables, never hard-coded.
- Document project setup, env vars (names and purpose, never values), API usage and important business logic.
- Use established security libraries. Before broad config changes or disabling a security control, understand the impact. Keep a rollback path for risky changes.

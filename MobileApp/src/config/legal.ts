/**
 * Who runs SportVenue, for the Privacy Policy, Terms and Cookie Policy.
 *
 * Fill these in before launch. Until then the legal pages show each missing
 * detail as "pending" instead of a made-up value. Keep this file identical to
 * WebApp/src/config/legal.ts.
 */
export const LEGAL = {
  /** Registered legal name of the business that operates SportVenue. */
  operatorName: '',
  /** Postal address of that business (the GDPR requires the controller's identity and contact details). */
  operatorAddress: '',
  /** Inbox for privacy requests and legal questions, for example a privacy@ address on the SportVenue domain. */
  contactEmail: '',
  /** Country whose law governs the Terms, for example "Pakistan". */
  governingLaw: '',
  /** EU and UK representative (GDPR Art. 27), if the business has no establishment there. Leave empty if not needed. */
  euRepresentative: '',
  /** Providers that process personal data for SportVenue (hosting, email delivery, payments). */
  processors: [] as { name: string; purpose: string; location: string }[],
  /** The date the current versions of the legal pages took effect (YYYY-MM-DD). */
  lastUpdated: '2026-10-19',
};

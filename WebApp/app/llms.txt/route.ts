import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/config/site';

/**
 * /llms.txt (llmstxt.org): a short, plain summary of the public site for
 * language-model tools. Optional and not a search ranking factor. Links are
 * absolute once the site's address is known (see config/site.ts).
 */
export const dynamic = 'force-static';

const url = (path: string) => (SITE_URL ? new URL(path, SITE_URL).toString() : path);

export function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} is the back office for sports facility owners: a calendar of every court, bookings priced from the venue's own rates and discounts, payments and outstanding balances per customer, and revenue and utilization reports. One owner account runs the whole venue. Plans are quoted per facility, based on the number of courts.

## Pages

- [${SITE_NAME}](${url('/welcome')}): what ${SITE_NAME} does, a tour of the product and how setup works
- [Get started](${url('/request-demo')}): tell us about your facility to get set up, book a demo or get a quote
- [Owner login](${url('/sign-in')}): log in to the owner app

## Optional

- [Privacy Policy](${url('/privacy')}): what personal data ${SITE_NAME} collects and the rights people have
- [Terms and Conditions](${url('/terms')}): the terms for using ${SITE_NAME}
- [Cookie Policy](${url('/cookies')}): what ${SITE_NAME} stores on a visitor's device
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

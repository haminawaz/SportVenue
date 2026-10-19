import { LEGAL } from '@/config/legal';

/**
 * The text of the Privacy Policy, Terms and Conditions and Cookie Policy,
 * shared word for word by the web and mobile apps (keep
 * MobileApp/src/features/legal/content.ts identical).
 *
 * Written from what the apps actually collect and store. It is a draft: a
 * qualified lawyer should review it before launch, and the operator details
 * in config/legal.ts must be filled in.
 *
 * Inline markup inside strings (see parseInline):
 *   **text**         bold lead-in
 *   [label](/path)   a link (in-app path, https://, or mailto:)
 *   {{label}}        a detail still to be confirmed, shown highlighted as pending
 */

export type InlinePart = { kind: 'text' | 'strong' | 'pending'; text: string } | { kind: 'link'; text: string; href: string };

const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\)|\{\{[^}]+\}\})/;

/** Splits a legal string into plain text, bold, links and pending markers. */
export function parseInline(source: string): InlinePart[] {
  return source
    .split(INLINE)
    .filter(Boolean)
    .map((piece): InlinePart => {
      if (piece.startsWith('**') && piece.endsWith('**')) return { kind: 'strong', text: piece.slice(2, -2) };
      if (piece.startsWith('{{') && piece.endsWith('}}')) return { kind: 'pending', text: piece.slice(2, -2) };
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(piece);
      if (link) return { kind: 'link', text: link[1], href: link[2] };
      return { kind: 'text', text: piece };
    });
}

export type LegalSlug = 'privacy' | 'terms' | 'cookies';

export type LegalBlock =
  | string
  | { list: string[] }
  | { table: { head: string[]; rows: string[][] } }
  /** A button that opens the cookie settings. */
  | { action: 'cookie-settings' };

export type LegalSection = { id: string; heading: string; blocks: LegalBlock[] };

export type LegalDocument = { slug: LegalSlug; title: string; description: string; sections: LegalSection[] };

const pending = (label: string) => `{{${label}}}`;

const OPERATOR = LEGAL.operatorName || pending('operator’s legal name');
const ADDRESS = LEGAL.operatorAddress || pending('postal address');
const EMAIL = LEGAL.contactEmail ? `[${LEGAL.contactEmail}](mailto:${LEGAL.contactEmail})` : pending('privacy contact email');
const LAW = LEGAL.governingLaw || pending('governing law');

/** True while any operator detail in config/legal.ts is still empty. */
export const LEGAL_DETAILS_PENDING = !LEGAL.operatorName || !LEGAL.operatorAddress || !LEGAL.contactEmail || !LEGAL.governingLaw;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "19 October 2026", formatted without the runtime locale so server and client agree. */
export const LAST_UPDATED = (() => {
  const [y, m, d] = LEGAL.lastUpdated.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
})();

export const LEGAL_LINKS: { slug: LegalSlug; label: string; href: string }[] = [
  { slug: 'privacy', label: 'Privacy Policy', href: '/privacy' },
  { slug: 'terms', label: 'Terms and Conditions', href: '/terms' },
  { slug: 'cookies', label: 'Cookie Policy', href: '/cookies' },
];

const contactBlocks: LegalBlock[] = [
  `SportVenue is operated by ${OPERATOR}, ${ADDRESS}.`,
  `Email: ${EMAIL}`,
  ...(LEGAL.euRepresentative ? [`Our representative in the EU and the UK: ${LEGAL.euRepresentative}.`] : []),
];

const processorsBlock: LegalBlock = LEGAL.processors.length
  ? { table: { head: ['Provider', 'What they do for us', 'Where'], rows: LEGAL.processors.map((p) => [p.name, p.purpose, p.location]) } }
  : `The providers we use for hosting, email delivery and payments will be listed here: ${pending('list of service providers')}.`;

/* ------------------------------------------------------------------ privacy */

const privacy: LegalDocument = {
  slug: 'privacy',
  title: 'Privacy Policy',
  description: 'What personal data SportVenue collects on its website and apps, why, who it is shared with, and the rights you have.',
  sections: [
    {
      id: 'summary',
      heading: 'In short',
      blocks: [
        {
          list: [
            'SportVenue is software that sports facilities use for bookings, payments and customer records.',
            'We collect what we need to run that service and to answer people who contact us. We don’t sell personal data and we don’t use it for advertising.',
            'The customer records a facility keeps in SportVenue belong to that facility. We look after them on its behalf.',
            'We don’t use advertising or tracking cookies. Analytics is off unless you allow it, and we don’t use any analytics tools today.',
            'You can ask to see, correct or delete your data at any time.',
          ],
        },
      ],
    },
    {
      id: 'who-we-are',
      heading: 'Who we are',
      blocks: [
        `SportVenue is operated by ${OPERATOR}, ${ADDRESS} (“SportVenue”, “we”, “us”). This policy covers the SportVenue website, the owner web app and the SportVenue mobile apps.`,
        'For data about you as a facility owner, a website visitor or someone who contacts us, we decide how it is used: we are the controller. For the customer records a facility keeps in SportVenue, such as its players’ names, phone numbers, bookings and payments, the facility is the controller and we process that data for it, as its processor.',
        `Questions about privacy: ${EMAIL}.`,
        ...(LEGAL.euRepresentative ? [`Our representative in the EU and the UK: ${LEGAL.euRepresentative}.`] : []),
      ],
    },
    {
      id: 'what-we-collect',
      heading: 'What we collect',
      blocks: [
        '**When you contact us** through “Get started”, “Book a demo” or “Get a quote”: your name, phone number, email address, facility name, city, number of courts, and anything you write in “Anything else?”.',
        '**When you have an owner account:** your first and last name, email address, phone number (optional), the password you sign in with, and your settings, such as notification choices and light or dark theme.',
        '**Facility details you enter:** facility name, description, sports, address, city, phone, email, website, opening hours, courts, prices, discounts, time zone and currency.',
        '**Records you keep about your customers:** name, phone number, email address (optional), regular booking slot, notes you write, bookings (court, time, price, discount, status and any cancellation reason) and payments (amount, method, date and note).',
        '**Subscription and billing:** your plan, price, renewal date and invoices. For the card on file, the app shows only the card brand, the last four digits and the expiry date.',
        '**Technical data:** like any online service, our servers receive technical information such as your IP address and browser type when you use SportVenue. What we store on your device is described in our [Cookie Policy](/cookies).',
      ],
    },
    {
      id: 'how-we-use-it',
      heading: 'How we use it, and our legal bases',
      blocks: [
        'Where the EU or UK GDPR applies, we rely on these legal bases:',
        {
          table: {
            head: ['Purpose', 'Legal basis'],
            rows: [
              ['Running your account and the service: storing your facility’s data, pricing bookings, showing reports, and sending the notifications you switch on', 'Performance of our contract with you'],
              ['Answering your “Get started”, demo or quote request', 'Steps you asked us to take before a contract, and our legitimate interest in replying to business enquiries'],
              ['Billing your subscription and keeping invoices', 'Contract, and our legal obligation to keep tax and accounting records'],
              ['Keeping SportVenue secure: sign-in sessions, password resets, and preventing misuse', 'Our legitimate interest in protecting the service and the people who use it'],
              ['Understanding how SportVenue is used (analytics)', 'Your consent. We don’t use any analytics tools today'],
            ],
          },
        },
        'We don’t sell personal data, we don’t use it for advertising, and we don’t make decisions about you based solely on automated processing that have legal or similarly significant effects.',
      ],
    },
    {
      id: 'customer-records',
      heading: 'Your customers’ data',
      blocks: [
        'If you run a facility, you decide which customer details to keep in SportVenue and why. You are responsible for telling your customers how you use their data and for having a lawful basis for it, including any parental consent your country requires for children.',
        'We use those records only to provide SportVenue to you and on your instructions. We don’t contact your customers for our own purposes.',
        'If you are a player and a facility keeps your details in SportVenue, please contact that facility first. We will help it respond to you.',
      ],
    },
    {
      id: 'sharing',
      heading: 'Who we share it with',
      blocks: [
        {
          list: [
            'Service providers that host and run SportVenue for us, under contracts that require them to protect the data and use it only for us.',
            'Authorities or other parties when the law requires it, or when it is needed to protect someone’s rights or safety.',
            'A buyer or successor if the SportVenue business changes hands. Your data would stay protected by this policy.',
          ],
        },
        processorsBlock,
        'Links you choose to open, such as a facility’s website or Google Maps for its address, take you to services with their own privacy policies.',
      ],
    },
    {
      id: 'transfers',
      heading: 'International transfers',
      blocks: [
        'Our providers may process data outside your country. When we transfer personal data from the EEA or the UK to a country without an adequacy decision, we use safeguards the law recognises, such as the European Commission’s Standard Contractual Clauses and the UK International Data Transfer Addendum. You can ask us for a copy.',
      ],
    },
    {
      id: 'retention',
      heading: 'How long we keep it',
      blocks: [
        {
          list: [
            'Owner account and facility data: while your account is open. After it closes we delete or anonymise it, except what the law requires us to keep.',
            'Customer records: until the facility deletes them or closes its account.',
            'Enquiries from our forms: as long as we need them to follow up. If you become a customer, they become part of your account.',
            'Invoices and billing records: as long as tax and accounting law requires.',
            'Data stored on your device: as described in our [Cookie Policy](/cookies).',
          ],
        },
      ],
    },
    {
      id: 'security',
      heading: 'How we protect it',
      blocks: [
        'Connections to SportVenue are encrypted with HTTPS, and the website sends security headers that block common attacks. In a browser, your sign-in lasts only until you close the tab. In the mobile app, it is kept in the device’s secure storage. Password reset links work once and expire after 30 minutes, and resetting your password signs out every device.',
        'No system is perfectly secure. If a data breach puts your rights at risk, we will tell you and the authorities when the law requires it.',
      ],
    },
    {
      id: 'your-rights',
      heading: 'Your rights',
      blocks: [
        'Under the EU and UK GDPR, and similar laws elsewhere, you can:',
        {
          list: [
            'get a copy of your personal data (access);',
            'have inaccurate data corrected;',
            'have your data deleted;',
            'restrict how we use it, or object to uses based on our legitimate interests;',
            'receive the data you gave us in a portable format;',
            'withdraw consent at any time, without affecting what we did before.',
          ],
        },
        `Owners can correct their profile and facility details, and delete customer records, directly in the app. For anything else, email ${EMAIL}. We reply within one month. To make sure nobody else can see or delete your data, we may ask you to confirm your identity first, for example by writing from the email address on your account.`,
        'You can also complain to a data protection authority: in the EU, the authority in your country; in the UK, the [Information Commissioner’s Office](https://ico.org.uk/make-a-complaint/). We’d appreciate the chance to help first.',
      ],
    },
    {
      id: 'children',
      heading: 'Children',
      blocks: [
        'SportVenue is a tool for businesses and is not meant for children. Owner accounts are for adults aged 18 or over, and we don’t knowingly collect children’s data for our own purposes. A facility that keeps records about junior players is responsible for having any consent its country requires.',
      ],
    },
    {
      id: 'cookies',
      heading: 'Cookies and device storage',
      blocks: ['We don’t use cookies for advertising or tracking. Our [Cookie Policy](/cookies) lists everything we store on your device, and you can change your choices at any time.'],
    },
    {
      id: 'changes',
      heading: 'Changes to this policy',
      blocks: ['When we change this policy we update the date at the top. Before a significant change takes effect, we tell owners in the app or by email.'],
    },
    { id: 'contact', heading: 'Contact us', blocks: contactBlocks },
  ],
};

/* ------------------------------------------------------------------ terms */

const terms: LegalDocument = {
  slug: 'terms',
  title: 'Terms and Conditions',
  description: 'The terms for using the SportVenue website, owner web app and mobile apps.',
  sections: [
    {
      id: 'agreement',
      heading: 'About these terms',
      blocks: [
        `These terms are an agreement between you and ${OPERATOR} (“SportVenue”, “we”, “us”) for the SportVenue website, owner web app and mobile apps (the “Service”). By creating an account or using the Service, you accept them.`,
        'If you use SportVenue for a facility, you accept these terms for that business and confirm that you are allowed to. Our [Privacy Policy](/privacy) explains how we handle personal data.',
      ],
    },
    {
      id: 'eligibility',
      heading: 'Who can use SportVenue',
      blocks: ['SportVenue is for businesses that run sports facilities. You must be at least 18 years old and give us accurate information when you sign up or contact us.'],
    },
    {
      id: 'account',
      heading: 'Your account',
      blocks: [
        {
          list: [
            'One owner account runs each facility. Keep your password private and don’t share your account.',
            'You are responsible for what happens in your account. Tell us straight away if you think someone else has used it.',
            'Keep your contact details up to date so we can reach you about your account.',
          ],
        },
      ],
    },
    {
      id: 'your-data',
      heading: 'Your data and your customers’ data',
      blocks: [
        'The data you put into SportVenue stays yours. You allow us to store and process it only to provide the Service to you, as described in our [Privacy Policy](/privacy).',
        'You are responsible for collecting your customers’ data lawfully, for telling them how you use it, and for the accuracy of what you enter, including the prices and bookings you agree with them. Where the law requires a data processing agreement between you and us, we will put one in place.',
      ],
    },
    {
      id: 'acceptable-use',
      heading: 'Acceptable use',
      blocks: [
        'You agree not to:',
        {
          list: [
            'use SportVenue for anything unlawful, harmful or fraudulent, or to send spam;',
            'try to get into other accounts or data, or to get around our security;',
            'probe or test the Service for vulnerabilities unless we have agreed to it in writing;',
            'overload, disrupt or reverse engineer the Service, except where the law allows it;',
            'resell or sublicense the Service without our written agreement.',
          ],
        },
      ],
    },
    {
      id: 'fees',
      heading: 'Plans, fees and payment',
      blocks: [
        'Plans are quoted per facility, based on the number of courts. The quote or order you accept sets out the price, the billing period, what is included and any refund terms.',
        {
          list: [
            'Fees are charged in advance for each billing period and renew automatically until you cancel.',
            'If a payment fails, we will let you know. If it stays unpaid, we may suspend the account until it is settled.',
            'Prices exclude taxes unless the quote says otherwise.',
            'We will tell you about a price change before it applies, starting from your next billing period.',
          ],
        },
      ],
    },
    {
      id: 'demo',
      heading: 'Demo versions',
      blocks: ['Demo versions of SportVenue run on sample data that resets and is not sent to us. Please don’t enter real personal data in a demo.'],
    },
    {
      id: 'availability',
      heading: 'Availability and changes to the Service',
      blocks: ['We work to keep SportVenue available and reliable, but we can’t promise it will always be uninterrupted or free of errors. We may improve or change features. If a change significantly reduces what your plan includes, we will tell you in advance.'],
    },
    {
      id: 'ending',
      heading: 'Ending your use',
      blocks: [
        'You can stop using SportVenue at any time. A cancellation takes effect at the end of the current billing period. Before you close your account, you can ask us for a copy of your data.',
        'We may suspend or close an account after a serious or repeated breach of these terms, or for fees that stay unpaid. Where it is reasonable, we will warn you first. After an account closes, we delete its data as our [Privacy Policy](/privacy) describes.',
      ],
    },
    {
      id: 'ip',
      heading: 'Intellectual property',
      blocks: ['SportVenue, including its software, design and brand, belongs to us or our licensors. While your subscription is active, we give you a limited, non-exclusive, non-transferable right to use the Service for your facility. If you send us feedback, we may use it to improve SportVenue.'],
    },
    {
      id: 'liability',
      heading: 'Disclaimers and liability',
      blocks: [
        'Reports and figures in SportVenue are calculated from the data you enter, so please check important figures. To the extent the law allows, the Service is provided “as is”.',
        'Nothing in these terms limits liability that the law does not allow to be limited, such as for fraud, or for death or personal injury caused by negligence. Otherwise, to the extent the law allows, we are not liable for indirect or consequential losses, or for lost profits, revenue, data or goodwill, and our total liability is limited to the fees you paid us in the 12 months before the claim.',
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to these terms',
      blocks: ['We may update these terms. We will tell you about significant changes before they take effect. If you keep using SportVenue after that, the new terms apply.'],
    },
    {
      id: 'law',
      heading: 'Governing law',
      blocks: [`These terms are governed by the laws of ${LAW}, and disputes are handled by its courts. If you are a consumer, you keep any protections the law of your country gives you.`],
    },
    { id: 'contact', heading: 'Contact us', blocks: contactBlocks },
  ],
};

/* ------------------------------------------------------------------ cookies */

const cookies: LegalDocument = {
  slug: 'cookies',
  title: 'Cookie Policy',
  description: 'The small amount of storage SportVenue uses on your device, why, and how to change your choices.',
  sections: [
    {
      id: 'summary',
      heading: 'In short',
      blocks: [
        'SportVenue doesn’t use advertising or tracking cookies. The website sets no cookies at all. It uses a small amount of browser storage that it needs to work, and the mobile app uses the device’s secure storage the same way.',
        'Analytics is an optional category that stays off unless you switch it on. We don’t use any analytics tools today.',
        { action: 'cookie-settings' },
      ],
    },
    {
      id: 'website',
      heading: 'What the website stores',
      blocks: [
        {
          table: {
            head: ['Name', 'Kind', 'Why', 'How long'],
            rows: [
              ['sportvenue.accessToken', 'Session storage · strictly necessary', 'Keeps you signed in on this tab', 'Until you close the tab or log out'],
              ['sportvenue.navDepth', 'Session storage · strictly necessary', 'Lets the in-app Back button return to the screen you came from', 'Until you close the tab'],
              ['sportvenue.appearance', 'Local storage · set when you choose', 'Remembers the light or dark theme you picked', 'Until you change it or clear your browser data'],
              ['sportvenue.consent', 'Local storage · strictly necessary', 'Remembers your cookie choices', '12 months, then we ask again'],
              ['sportvenue.mock.auth', 'Local storage · demo versions only', 'Keeps the sample sign-in working in a demo', 'Until you clear your browser data'],
            ],
          },
        },
      ],
    },
    {
      id: 'app',
      heading: 'What the mobile app stores',
      blocks: [
        {
          table: {
            head: ['What', 'Kind', 'Why', 'How long'],
            rows: [
              ['Sign-in token', 'Device secure storage · strictly necessary', 'Keeps you signed in', 'Until you log out'],
              ['Theme', 'Device secure storage · set when you choose', 'Remembers the light or dark theme you picked', 'Until you change it or remove the app'],
              ['Privacy choices', 'Device secure storage · strictly necessary', 'Remembers your choices about optional storage', '12 months, then we ask again'],
            ],
          },
        },
      ],
    },
    {
      id: 'analytics',
      heading: 'Analytics',
      blocks: ['We don’t use any analytics tools today. If we add one, we will list it here first, and it will only run on your device while Analytics is switched on in your settings.'],
    },
    {
      id: 'third-parties',
      heading: 'Third parties',
      blocks: ['Our fonts and images are served from our own site, so opening SportVenue doesn’t contact Google or other third parties. Links you choose to open, such as Google Maps for a facility’s address, take you to services with their own cookie policies.'],
    },
    {
      id: 'choices',
      heading: 'Changing your choices',
      blocks: [
        'You can change or withdraw your choices at any time with the cookie settings button on our public pages, from Settings in the app, or here:',
        { action: 'cookie-settings' },
        'You can also clear SportVenue’s storage in your browser settings. If you do, you will be signed out and we will ask for your choices again.',
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to this policy',
      blocks: ['When we change this policy we update the date at the top. If we add a new kind of optional storage, we ask for your choice again.'],
    },
    { id: 'contact', heading: 'Contact us', blocks: contactBlocks },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalSlug, LegalDocument> = { privacy, terms, cookies };

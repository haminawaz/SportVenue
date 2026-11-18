/**
 * Regional defaults. SportVenue is built for the United States first and
 * sold internationally; supporting another market means adding a Region here
 * and pointing REGION at it, not editing screens.
 *
 * A facility's own currency and time zone (from the API) always win for its
 * amounts and times. These values are for formatting (locale), for new
 * facilities, for examples in forms, and for what address parts are called.
 *
 * Keep identical in WebApp/src/config/region.ts and MobileApp/src/config/region.ts.
 */
export type Region = {
  /** ISO 3166-1 country code. */
  country: string;
  /** BCP 47 locale for numbers, money and dates. */
  locale: string;
  /** ISO 4217 currency for new facilities, and the fallback before a facility loads. */
  currency: string;
  /** IANA time zone for new facilities. */
  timeZone: string;
  /** Dialling code, and the number shown as an example in phone fields. */
  phone: { code: string; example: string };
  /** What the address parts are called, and the postal code format if there is one. */
  address: { regionLabel: string; postalCodeLabel: string; postalCodeExample: string; postalCodePattern?: RegExp };
  /** Offered first in facility settings; any other valid value can still be kept. */
  currencies: string[];
  timeZones: string[];
};

export const UNITED_STATES: Region = {
  country: 'US',
  locale: 'en-US',
  currency: 'USD',
  timeZone: 'America/New_York',
  phone: { code: '+1', example: '(512) 555-0142' },
  address: { regionLabel: 'State', postalCodeLabel: 'ZIP code', postalCodeExample: '78702', postalCodePattern: /^\d{5}(-\d{4})?$/ },
  currencies: ['USD', 'CAD', 'MXN', 'EUR', 'GBP', 'AUD', 'NZD', 'SGD', 'AED', 'SAR', 'INR', 'JPY', 'BRL', 'ZAR'],
  timeZones: [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Phoenix',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Madrid',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Pacific/Auckland',
    'Africa/Johannesburg',
  ],
};

/** The market the app is set up for. */
export const REGION: Region = UNITED_STATES;

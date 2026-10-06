/**
 * Money formatting. Amounts arrive from the backend in major units
 * (24500 = Rs 24,500) in the facility's currency. This module only
 * formats; it never converts or calculates.
 */

const cache = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, display: 'narrowSymbol' | 'name', locale?: string) {
  const key = `${locale ?? ''}|${currency}|${display}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: display,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    cache.set(key, f);
  }
  return f;
}

function fallback(amount: number, currency: string) {
  const rounded = Math.round(amount * 100) / 100;
  const [whole, fraction] = String(Math.abs(rounded)).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${rounded < 0 ? '-' : ''}${currency} ${grouped}${fraction ? `.${fraction.padEnd(2, '0')}` : ''}`;
}

/**
 * Short symbols for engines that ignore currencyDisplay: 'narrowSymbol'
 * (Hermes on Android prints "PKR 24,500"). Codes not listed keep their code.
 */
const NARROW: Record<string, string> = { PKR: 'Rs', INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: '$', CAD: '$', SAR: 'SAR', AED: 'AED' };

function narrow(text: string, currency: string) {
  const symbol = NARROW[currency];
  return symbol && symbol !== currency && text.includes(currency) ? text.replace(currency, symbol).replace(/\s{2,}/g, ' ') : text;
}

/** "Rs 24,500" style, for display. */
export function formatMoney(amount: number, currency: string, locale?: string): string {
  try {
    return narrow(formatter(currency, 'narrowSymbol', locale).format(amount), currency);
  } catch {
    return narrow(fallback(amount, currency), currency);
  }
}

/** The symbol the app prints for a currency: "Rs", "$", "€", or the code when there is no shorter one. */
export function moneySymbol(currency: string): string {
  return formatMoney(0, currency).replace(/[\d.,\s -]/g, '') || currency;
}

/** "24,500 Pakistani rupees" style, for screen readers. */
export function formatMoneyForA11y(amount: number, currency: string, locale?: string): string {
  try {
    return formatter(currency, 'name', locale).format(amount);
  } catch {
    return fallback(amount, currency);
  }
}

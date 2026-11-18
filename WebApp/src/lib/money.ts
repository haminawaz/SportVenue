import { REGION } from '@/config/region';

/**
 * Money formatting. Amounts arrive from the backend in major units
 * (24500 = $24,500) in the facility's currency. This module only
 * formats; it never converts or calculates.
 *
 * Whole amounts print without decimals ("$1,250"); anything with cents prints
 * the currency's usual digits ("$38.50", never "$38.5"). The locale is the
 * region's (en-US), so every visitor sees amounts the same way.
 */

const cache = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, display: 'narrowSymbol' | 'name', locale: string, whole: boolean) {
  const key = `${locale}|${currency}|${display}|${whole}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: display,
      ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
    });
    cache.set(key, f);
  }
  return f;
}

const isWhole = (amount: number) => Number.isInteger(Math.round(amount * 100) / 100);

function fallback(amount: number, currency: string) {
  const rounded = Math.round(amount * 100) / 100;
  const [whole, fraction] = String(Math.abs(rounded)).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${rounded < 0 ? '-' : ''}${currency} ${grouped}${fraction ? `.${fraction.padEnd(2, '0')}` : ''}`;
}

/** "$24,500" or "$38.50", for display. */
export function formatMoney(amount: number, currency: string, locale: string = REGION.locale): string {
  try {
    return formatter(currency, 'narrowSymbol', locale, isWhole(amount)).format(amount);
  } catch {
    return fallback(amount, currency);
  }
}

/** "24,500 US dollars" style, for screen readers. */
export function formatMoneyForA11y(amount: number, currency: string, locale: string = REGION.locale): string {
  try {
    return formatter(currency, 'name', locale, isWhole(amount)).format(amount);
  } catch {
    return fallback(amount, currency);
  }
}

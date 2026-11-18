import { REGION } from '@/config/region';

/**
 * Accepts phone numbers as people write them anywhere: "+1 (512) 555-0142",
 * "512.555.0142", "+44 20 7946 0958". Digits, spaces, dots, dashes and
 * brackets, an optional leading "+", and 7 to 15 digits (the E.164 maximum).
 * It checks the shape only; the backend decides what it can reach.
 */
export function isPhoneNumber(value: string): boolean {
  const v = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
}

/** The example shown in phone fields and errors: "+1 (512) 555-0142". */
export const PHONE_EXAMPLE = `${REGION.phone.code} ${REGION.phone.example}`;

/** A tel: link with only digits and the leading "+", however the number is written. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

import { REGION } from '@/config/region';
import type { Facility } from '@/domain/types';

type Place = Pick<Facility, 'address' | 'city' | 'state' | 'postalCode'>;

/** "Austin, TX 78702": the line under the street, US style. Missing parts are skipped. */
export function localityLine(p: Place): string {
  return [p.city, [p.state, p.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

/** "2401 E 6th St, Austin, TX 78702": the whole address on one line, for maps. */
export function oneLineAddress(p: Place): string {
  return [p.address, localityLine(p)].filter(Boolean).join(', ');
}

/** Checks a ZIP or postal code against the format of the facility's country, when the region knows it. */
export function postalCodeProblem(code: string, country: string = REGION.country): string | undefined {
  const label = REGION.address.postalCodeLabel;
  if (!code.trim()) return `Enter the ${label}.`;
  const pattern = country === REGION.country ? REGION.address.postalCodePattern : undefined;
  return pattern && !pattern.test(code.trim()) ? `Enter a valid ${label}, for example ${REGION.address.postalCodeExample}.` : undefined;
}

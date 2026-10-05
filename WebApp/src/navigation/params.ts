'use client';

import { useParams, useSearchParams } from 'next/navigation';

/** A dynamic route segment, for example the `id` in /booking/[id]. */
export function useRouteParam(name: string): string {
  const params = useParams<Record<string, string | string[]>>();
  const value = params?.[name];
  const raw = (Array.isArray(value) ? value[0] : value) ?? '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Query-string values as an object of optional strings (empty values count as missing). */
export function useQueryParams<K extends string>(...names: K[]): Partial<Record<K, string>> {
  const search = useSearchParams();
  const out: Partial<Record<K, string>> = {};
  for (const n of names) {
    const v = search.get(n);
    if (v) out[n] = v;
  }
  return out;
}

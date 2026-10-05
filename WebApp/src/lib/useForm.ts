import { useCallback, useMemo, useState } from 'react';

import { fieldErrorsOf } from '@/api/errors';

export type Errors = Record<string, string | undefined>;

/**
 * Small form state helper.
 * - Client validation runs on submit, then live on every change after that.
 * - 422 field errors from the server are merged in under matching field names.
 */
export function useForm<T extends Record<string, unknown>>(initial: T, validate: (values: T) => Errors) {
  const [values, setValues] = useState<T>(initial);
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [baseline, setBaseline] = useState(initial);

  const clientErrors = useMemo(() => (attempted ? validate(values) : {}), [attempted, validate, values]);
  const errors = useMemo(() => {
    const merged: Errors = { ...serverErrors };
    for (const [k, v] of Object.entries(clientErrors)) if (v) merged[k] = v;
    return merged;
  }, [clientErrors, serverErrors]);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setServerErrors((e) => (e[key as string] ? { ...e, [key as string]: undefined } : e));
  }, []);

  const patch = useCallback((p: Partial<T>) => setValues((v) => ({ ...v, ...p })), []);

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(baseline), [values, baseline]);

  /** Validates, then runs `action`. Returns true on success. */
  const submit = useCallback(
    async (action: (values: T) => Promise<unknown>) => {
      setAttempted(true);
      const found = validate(values);
      if (Object.values(found).some(Boolean)) return false;
      try {
        await action(values);
        return true;
      } catch (error) {
        setServerErrors(fieldErrorsOf(error));
        return false;
      }
    },
    [validate, values],
  );

  const reset = useCallback((next: T) => {
    setBaseline(next);
    setValues(next);
    setServerErrors({});
    setAttempted(false);
  }, []);

  return { values, set, patch, errors, submit, dirty, reset, attempted };
}

export const rules = {
  required: (v: unknown, message: string) => (v === undefined || v === null || String(v).trim() === '' ? message : undefined),
  email: (v: string | undefined, required = true) => {
    if (!v?.trim()) return required ? 'Enter an email address.' : undefined;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? undefined : 'Enter a valid email address.';
  },
  phone: (v: string | undefined, required = true) => {
    if (!v?.trim()) return required ? 'Enter a phone number.' : undefined;
    return /^\+?[0-9][0-9\s-]{6,18}$/.test(v.trim()) ? undefined : 'Enter a valid phone number, for example +92 300 1234567.';
  },
  money: (v: string, label = 'amount') => {
    const n = parseMoney(v);
    if (v.trim() === '') return `Enter an ${label}.`;
    if (Number.isNaN(n)) return 'Use numbers only.';
    if (n <= 0) return `Enter an ${label} above zero.`;
    return undefined;
  },
};

/** Accepts "2,500", "2500.5". Returns NaN for anything else. */
export function parseMoney(v: string): number {
  const cleaned = v.replace(/,/g, '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

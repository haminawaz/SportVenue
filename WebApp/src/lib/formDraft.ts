/**
 * Keeps a half-filled form while the owner steps away to another screen and
 * comes back, for example "Add a new customer" from the booking form.
 *
 * On a native stack the form stays mounted underneath; in the browser the
 * route unmounts, so the form parks its values here and picks them up again
 * when it remounts. One-shot, in memory, never persisted.
 */
const drafts = new Map<string, unknown>();

export const formDraft = {
  put<T>(key: string, values: T) {
    drafts.set(key, values);
  },
  take<T>(key: string): T | undefined {
    const value = drafts.get(key) as T | undefined;
    drafts.delete(key);
    return value;
  },
};

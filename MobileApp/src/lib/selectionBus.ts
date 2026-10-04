/**
 * One-shot hand-off between screens, for example "create a customer, then
 * come back to the booking form with them selected".
 */
const pending = new Map<string, string>();

export const selectionBus = {
  put(channel: 'customer', id: string) {
    pending.set(channel, id);
  },
  take(channel: 'customer'): string | undefined {
    const id = pending.get(channel);
    pending.delete(channel);
    return id;
  },
};

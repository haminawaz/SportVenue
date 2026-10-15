/**
 * Password rules for a new password. The reset screen shows them as a live
 * checklist and the server enforces the same ones.
 */

export const PASSWORD_MIN_LENGTH = 8;

export type PasswordCheck = { key: 'length' | 'mix'; label: string; ok: boolean };

export function passwordChecks(password: string): PasswordCheck[] {
  return [
    { key: 'length', label: `At least ${PASSWORD_MIN_LENGTH} characters`, ok: password.length >= PASSWORD_MIN_LENGTH },
    { key: 'mix', label: 'At least one letter and one number', ok: /[A-Za-z]/.test(password) && /\d/.test(password) },
  ];
}

/** The first rule a new password breaks, as a sentence for the field error, or undefined when it passes. */
export function passwordProblem(password: string): string | undefined {
  if (!password) return 'Enter a new password.';
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!(/[A-Za-z]/.test(password) && /\d/.test(password))) return 'Use at least one letter and one number.';
  return undefined;
}

/** "j***@baselinepadel.pk": enough to recognise the account without spelling out the address. */
export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name.slice(0, 1)}${'*'.repeat(Math.max(2, Math.min(name.length - 1, 4)))}@${domain}`;
}

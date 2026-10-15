'use client';

import { useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Circle, LinkBreak, LockSimple } from '@phosphor-icons/react';

import { ApiError } from '@/api/client';
import { toUserFacingError } from '@/api/errors';
import { passwordChecks, passwordProblem } from '@/lib/passwordRules';
import { useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { notePush } from '@/navigation/useAppRouter';
import { useAuth } from '@/session/SessionProvider';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { ErrorState } from '@/ui/ErrorState';
import { TextField } from '@/ui/Fields';
import { Notice } from '@/ui/States';

import { useResetLink, useResetPassword } from '../api';
import { AuthLayout } from '../components/AuthLayout';

/** The reset link is unusable: the server's 410 codes, or no token in the URL at all. */
const LINK_PROBLEMS: Record<string, { title: string; message: string }> = {
  RESET_EXPIRED: { title: 'This link has expired', message: 'Reset links work for 30 minutes. Request a new one and use it straight away.' },
  RESET_USED: { title: 'This link was already used', message: 'Each reset link works once. If you still need to change your password, request a new link.' },
  RESET_INVALID: { title: 'This link is not valid', message: 'It may be incomplete or out of date. Request a new reset link.' },
};

type Values = { password: string; confirm: string };

/**
 * Step two of a password reset, opened from the emailed link
 * (/reset-password?token=...). Checks the link first, then asks for the new
 * password twice with the rules shown as a live checklist. On success every
 * existing session of the owner is signed out, including this browser's.
 */
export function ResetPasswordScreen() {
  const token = useSearchParams().get('token') ?? '';
  const { status, signOut } = useAuth();
  const link = useResetLink(token);
  const reset = useResetPassword();
  const [linkProblem, setLinkProblem] = useState<string | null>(token ? null : 'RESET_INVALID');
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useForm<Values>(
    { password: '', confirm: '' },
    useCallback(
      (v: Values) => ({
        password: passwordProblem(v.password),
        confirm: !v.confirm ? 'Enter the new password again.' : v.confirm !== v.password ? 'The passwords do not match.' : undefined,
      }),
      [],
    ),
  );

  const save = async () => {
    setFormError(null);
    await form.submit(async (v) => {
      try {
        await reset.mutateAsync({ token, password: v.password });
      } catch (error) {
        if (error instanceof ApiError && error.status === 410) setLinkProblem(error.code ?? 'RESET_INVALID');
        else if (!(error instanceof ApiError && error.status === 422)) setFormError(toUserFacingError(error, "Couldn't save the password").message);
        throw error;
      }
      // The server signed this owner out everywhere; drop any local session too.
      if (status === 'signedIn') await signOut();
      setDone(true);
    });
  };

  const linkError = link.error instanceof ApiError && link.error.status === 410 ? (link.error.code ?? 'RESET_INVALID') : null;
  const problem = linkProblem ?? linkError;

  if (done) {
    return (
      <AuthLayout eyebrow="Account help" title="Password updated">
        <div className="surface-card flex flex-col items-center gap-3 p-8 text-center">
          <span className="mb-1 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent-soft text-accent">
            <CheckCircle size={40} weight="fill" aria-hidden />
          </span>
          <AppText as="h2" variant="display-md">
            You are all set
          </AppText>
          <AppText variant="body-md" tone="muted">
            Log in with your new password. For your security, every device that was signed in has been signed out.
          </AppText>
          <Button label="Log in" size="lg" block href={routes.signIn} onPress={notePush} className="mt-2 w-full" />
        </div>
      </AuthLayout>
    );
  }

  if (problem) {
    const copy = LINK_PROBLEMS[problem] ?? LINK_PROBLEMS.RESET_INVALID;
    return (
      <AuthLayout eyebrow="Account help" title={copy.title}>
        <div className="surface-card flex flex-col gap-4 p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning">
            <LinkBreak size={24} weight="bold" aria-hidden />
          </span>
          <AppText variant="body-md" tone="muted">
            {copy.message}
          </AppText>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button label="Request a new link" size="lg" block href={routes.forgotPassword()} onPress={notePush} />
            <Button label="Back to log in" variant="secondary" size="lg" block href={routes.signIn} onPress={notePush} />
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (link.isError) {
    const err = toUserFacingError(link.error, "Couldn't check the link");
    return (
      <AuthLayout eyebrow="Account help" title="Set a new password">
        <ErrorState title={err.title} message={err.message} onRetry={() => void link.refetch()} retrying={link.isFetching} />
      </AuthLayout>
    );
  }

  const checks = passwordChecks(form.values.password);

  return (
    <AuthLayout
      eyebrow="Account help"
      title="Set a new password"
      lead={link.data ? `For the account ${link.data.email}. Choose something you have not used here before.` : 'Checking your reset link…'}
    >
      <form
        noValidate
        aria-busy={link.isPending || undefined}
        className={cn('flex flex-col gap-4 transition-opacity', link.isPending && 'pointer-events-none opacity-50')}
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {formError && <Notice tone="danger" message={formError} />}
        <div className="flex flex-col gap-2">
          <TextField
            label="New password"
            icon={LockSimple}
            value={form.values.password}
            onChangeText={(t) => form.set('password', t)}
            error={form.errors.password}
            secureTextEntry
            autoComplete="new-password"
            enterKeyHint="next"
          />
          <ul aria-label="Password rules" className="flex flex-col gap-1 pl-0.5">
            {checks.map((c) => (
              <li key={c.key} className={cn('flex items-center gap-2 t-small', c.ok ? 'text-accent' : 'text-text-muted')}>
                {c.ok ? <CheckCircle size={16} weight="fill" aria-hidden /> : <Circle size={16} aria-hidden />}
                <span>
                  {c.label}
                  <span className="sr-only">{c.ok ? ', done' : ', not yet'}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <TextField
          label="Confirm new password"
          icon={LockSimple}
          value={form.values.confirm}
          onChangeText={(t) => form.set('confirm', t)}
          error={form.errors.confirm}
          secureTextEntry
          autoComplete="new-password"
          enterKeyHint="done"
        />
        <Button type="submit" label="Set new password" size="lg" block loading={reset.isPending} disabled={link.isPending} />
      </form>
    </AuthLayout>
  );
}

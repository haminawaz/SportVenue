'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, EnvelopeSimple, PaperPlaneTilt } from '@phosphor-icons/react';

import { ApiError } from '@/api/client';
import { toUserFacingError } from '@/api/errors';
import { USE_MOCKS } from '@/config/env';
import { rules, useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { notePush } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/Fields';
import { Notice } from '@/ui/States';

import { useForgotPassword } from '../api';
import { AuthLayout } from '../components/AuthLayout';

/**
 * Step one of a password reset: the owner enters their email and we send a
 * link. The confirmation reads the same whether or not the email has an
 * account. Demo builds have no inbox, so they also offer the link directly.
 */
export function ForgotPasswordScreen() {
  const params = useSearchParams();
  const request = useForgotPassword();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ email: string; demoToken?: string } | null>(null);

  const form = useForm(
    { email: params.get('email') ?? '' },
    useCallback((v: { email: string }) => ({ email: rules.email(v.email) }), []),
  );

  const send = async () => {
    setFormError(null);
    await form.submit(async (v) => {
      const email = v.email.trim();
      try {
        const res = await request.mutateAsync(email);
        setSent({ email, demoToken: res.demoResetToken });
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 422)) setFormError(toUserFacingError(error, "Couldn't send the link").message);
        throw error;
      }
    });
  };

  if (sent) {
    return (
      <AuthLayout eyebrow="Account help" title="Check your email" lead={`If an account exists for ${sent.email}, we sent it a link to set a new password.`}>
        <div className="surface-card flex flex-col gap-4 p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <PaperPlaneTilt size={24} weight="fill" aria-hidden />
          </span>
          <AppText variant="body-md" tone="muted">
            The link works for 30 minutes and only once. If it does not arrive in a few minutes, check your spam folder or send it again.
          </AppText>
          {formError && <Notice tone="danger" message={formError} />}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button label="Back to log in" size="lg" block href={routes.signIn} onPress={notePush} />
            <Button label="Send again" variant="secondary" size="lg" block loading={request.isPending} onPress={() => void send()} />
          </div>
        </div>

        {USE_MOCKS && sent.demoToken && (
          <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border p-4 text-center">
            <AppText variant="body-sm" tone="muted">
              Demo mode: there is no inbox here, so you can open the reset link directly.
            </AppText>
            <Button label="Open the reset link" variant="ghost" size="sm" href={routes.resetPassword(sent.demoToken)} onPress={notePush} />
          </div>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Account help" title="Reset your password" lead="Enter the email you use to log in. We will send you a link to set a new password.">
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        {formError && <Notice tone="danger" message={formError} />}
        <TextField
          label="Email"
          icon={EnvelopeSimple}
          placeholder="you@yourfacility.com"
          value={form.values.email}
          onChangeText={(t) => form.set('email', t)}
          error={form.errors.email}
          type="email"
          autoCapitalize="none"
          autoComplete="username"
          enterKeyHint="send"
        />
        <Button type="submit" label="Send reset link" size="lg" block loading={request.isPending} />
      </form>

      <p className="text-center t-body-sm text-text-muted">
        <Link href={routes.signIn} onClick={notePush} className="inline-flex items-center gap-1.5 rounded-badge font-semibold text-accent underline-offset-4 hover:underline">
          <ArrowLeft size={14} weight="bold" aria-hidden />
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}

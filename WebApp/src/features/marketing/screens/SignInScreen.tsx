'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { EnvelopeSimple, LockSimple } from '@phosphor-icons/react';

import { ApiError } from '@/api/client';
import { toUserFacingError } from '@/api/errors';
import { USE_MOCKS } from '@/config/env';
import { rules, useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { notePush } from '@/navigation/useAppRouter';
import { useAuth } from '@/session/SessionProvider';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/Fields';
import { Notice } from '@/ui/States';

import { AuthLayout } from '../components/AuthLayout';

export function SignInScreen() {
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm(
    { email: '', password: '' },
    useCallback((v: { email: string; password: string }) => ({
      email: rules.email(v.email),
      password: rules.required(v.password, 'Enter your password.'),
    }), []),
  );

  const onSubmit = async () => {
    setSubmitting(true);
    setFormError(null);
    await form.submit(async (v) => {
      try {
        await signIn(v.email, v.password);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) setFormError(error.message || 'Email or password is incorrect.');
        else if (!(error instanceof ApiError && error.status === 422)) setFormError(toUserFacingError(error, "Couldn't log in").message);
        throw error;
      }
    });
    setSubmitting(false);
  };

  return (
    <AuthLayout eyebrow="Welcome back" title="Owner login" lead="See today’s bookings, payments and courts in one place.">
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
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
          enterKeyHint="next"
        />
        <TextField
          label="Password"
          icon={LockSimple}
          value={form.values.password}
          onChangeText={(t) => form.set('password', t)}
          error={form.errors.password}
          secureTextEntry
          autoComplete="current-password"
          enterKeyHint="go"
        />
        <Button type="submit" label="Log in" size="lg" block loading={submitting} />
      </form>

      <p className="text-center t-body-sm text-text-muted">
        New to SportVenue?{' '}
        <Link
          href={routes.requestDemo()}
          onClick={notePush}
          className="rounded-badge font-semibold text-accent underline-offset-4 hover:underline"
        >
          Get started
        </Link>
      </p>

      {USE_MOCKS && (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border p-4">
          <AppText variant="body-sm" tone="muted">
            Demo mode: sample owners
          </AppText>
          <div className="grid grid-cols-2 gap-2 self-stretch">
            <Button
              label="Seeded facility"
              variant="ghost"
              size="sm"
              block
              aria-label="Fill in the owner account with sample data"
              onPress={() => form.patch({ email: 'john@baselinepadel.pk', password: 'sportvenue123' })}
            />
            <Button
              label="Empty facility"
              variant="ghost"
              size="sm"
              block
              aria-label="Fill in the owner account with no data"
              onPress={() => form.patch({ email: 'emma@greenlinearena.pk', password: 'sportvenue123' })}
            />
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

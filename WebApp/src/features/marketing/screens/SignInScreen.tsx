'use client';

import { useCallback, useState } from 'react';
import { ArrowRight, EnvelopeSimple, LockSimple } from '@phosphor-icons/react';

import { ApiError } from '@/api/client';
import { toUserFacingError } from '@/api/errors';
import { USE_MOCKS } from '@/config/env';
import { rules, useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { useAuth } from '@/session/SessionProvider';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/Fields';
import { Notice } from '@/ui/States';

import { AuthLayout } from '../components/AuthLayout';

export function SignInScreen() {
  const router = useAppRouter();
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

      <div className="flex items-center gap-3 rounded-card bg-surface-muted py-4 pr-3 pl-5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <AppText variant="body-strong">New to SportVenue?</AppText>
          <AppText variant="body-sm" tone="muted">
            We set it up with your courts.
          </AppText>
        </div>
        <Button label="Get started" variant="accent" size="sm" trailingIcon={ArrowRight} onPress={() => router.push(routes.requestDemo())} className="self-center" />
      </div>

      {/* NODE_ENV repeated so production builds drop the sample accounts entirely. */}
      {process.env.NODE_ENV !== 'production' && USE_MOCKS && (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border p-4">
          <AppText variant="body-sm" tone="muted">
            Development build: sample owners
          </AppText>
          <div className="flex gap-2 self-stretch">
            <Button
              label="Seeded facility"
              variant="ghost"
              size="sm"
              block
              aria-label="Fill in the owner account with sample data"
              onPress={() => form.patch({ email: 'hamid@baselinepadel.pk', password: 'sportvenue123' })}
            />
            <Button
              label="Empty facility"
              variant="ghost"
              size="sm"
              block
              aria-label="Fill in the owner account with no data"
              onPress={() => form.patch({ email: 'sana@greenlinearena.pk', password: 'sportvenue123' })}
            />
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

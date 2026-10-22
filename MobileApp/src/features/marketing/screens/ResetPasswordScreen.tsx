import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, CircleDashed, LinkBreak, LockSimple } from 'phosphor-react-native';

import { ApiError } from '@/api/client';
import { toUserFacingError } from '@/api/errors';
import { passwordChecks, passwordProblem } from '@/lib/passwordRules';
import { useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { useAuth } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { ErrorState } from '@/ui/ErrorState';
import { TextField } from '@/ui/Fields';
import { Notice } from '@/ui/States';
import { useSurface } from '@/ui/surface';

import { useResetLink, useResetPassword } from '../api';
import { AuthLayout } from '../components/AuthLayout';

/** The reset link is unusable: the server's 410 codes, or no token in the link at all. */
const LINK_PROBLEMS: Record<string, { title: string; message: string }> = {
  RESET_EXPIRED: { title: 'This link has expired', message: 'Reset links work for 30 minutes. Request a new one and use it straight away.' },
  RESET_USED: { title: 'This link was already used', message: 'Each reset link works once. If you still need to change your password, request a new link.' },
  RESET_INVALID: { title: 'This link is not valid', message: 'It may be incomplete or out of date. Request a new reset link.' },
};

type Values = { password: string; confirm: string };

/**
 * Step two of a password reset, opened from the emailed link
 * (sportvenue://reset-password?token=...). Checks the link first, then asks
 * for the new password twice with the rules shown as a live checklist. On
 * success every existing session of the owner is signed out, this one included.
 */
export function ResetPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const surface = useSurface();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : '';
  const { status, signOut } = useAuth();
  const link = useResetLink(token);
  const reset = useResetPassword();
  const [linkProblem, setLinkProblem] = useState<string | null>(token ? null : 'RESET_INVALID');
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useForm<Values>(
    { password: '', confirm: '' },
    (v) => ({
      password: passwordProblem(v.password),
      confirm: !v.confirm ? 'Enter the new password again.' : v.confirm !== v.password ? 'The passwords do not match.' : undefined,
    }),
    // This screen prints its own inline error.
    { reportErrors: false },
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
        <View style={[surface, styles.done]}>
          <View style={[styles.doneIcon, { backgroundColor: colors.accentSoft }]}>
            <CheckCircle size={40} color={colors.accent} weight="fill" />
          </View>
          <AppText variant="display-md" role="heading" style={styles.center}>
            You are all set
          </AppText>
          <AppText tone="muted" style={styles.center}>
            Log in with your new password. For your security, every device that was signed in has been signed out.
          </AppText>
          <Button label="Log in" size="lg" block onPress={() => router.replace(routes.signIn)} />
        </View>
      </AuthLayout>
    );
  }

  if (problem) {
    const copy = LINK_PROBLEMS[problem] ?? LINK_PROBLEMS.RESET_INVALID;
    return (
      <AuthLayout eyebrow="Account help" title={copy.title}>
        <View style={[surface, styles.card]}>
          <View style={[styles.icon, { backgroundColor: colors.warningSoft }]}>
            <LinkBreak size={24} color={colors.warning} weight="bold" />
          </View>
          <AppText tone="muted">{copy.message}</AppText>
          <Button label="Request a new link" size="lg" block onPress={() => router.replace(routes.forgotPassword())} />
          <Button label="Back to log in" variant="secondary" size="lg" block onPress={() => router.replace(routes.signIn)} />
        </View>
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
      <View style={[surface, styles.card, link.isPending && styles.busy]} aria-busy={link.isPending}>
        {formError && <Notice tone="danger" message={formError} />}
        <View style={styles.field}>
          <TextField
            label="New password"
            icon={LockSimple}
            value={form.values.password}
            onChangeText={(t) => form.set('password', t)}
            error={form.errors.password}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
          />
          <View role="list" aria-label="Password rules" style={styles.checks}>
            {checks.map((c) => (
              <View key={c.key} role="listitem" style={styles.check} aria-label={`${c.label}, ${c.ok ? 'done' : 'not yet'}`}>
                {c.ok ? <CheckCircle size={16} color={colors.accent} weight="fill" /> : <CircleDashed size={16} color={colors.textMuted} />}
                <AppText variant="body-sm" tone={c.ok ? 'accent' : 'muted'}>
                  {c.label}
                </AppText>
              </View>
            ))}
          </View>
        </View>
        <TextField
          label="Confirm new password"
          icon={LockSimple}
          value={form.values.confirm}
          onChangeText={(t) => form.set('confirm', t)}
          error={form.errors.confirm}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={() => void save()}
        />
        <Button label="Set new password" size="lg" block loading={reset.isPending} disabled={link.isPending} onPress={() => void save()} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.xl, gap: spacing.lg },
  busy: { opacity: 0.5 },
  field: { gap: spacing.sm },
  checks: { gap: spacing.xs, paddingLeft: 2 },
  check: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  done: { alignItems: 'center', gap: spacing.md, padding: spacing.xxl },
  doneIcon: { width: 72, height: 72, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  center: { textAlign: 'center' },
});

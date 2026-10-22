import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, EnvelopeSimple, PaperPlaneTilt } from 'phosphor-react-native';

import { ApiError } from '@/api/client';
import { toUserFacingError } from '@/api/errors';
import { USE_MOCKS } from '@/config/env';
import { rules, useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily, radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/Fields';
import { Notice } from '@/ui/States';
import { useSurface } from '@/ui/surface';

import { useForgotPassword } from '../api';
import { AuthLayout } from '../components/AuthLayout';

/**
 * Step one of a password reset: the owner enters their email and we send a
 * link. The confirmation reads the same whether or not the email has an
 * account. Demo builds have no inbox, so they also offer the link directly.
 */
export function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const surface = useSurface();
  const params = useLocalSearchParams<{ email?: string }>();
  const request = useForgotPassword();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ email: string; demoToken?: string } | null>(null);

  const form = useForm(
    { email: typeof params.email === 'string' ? params.email : '' },
    (v) => ({ email: rules.email(v.email) }),
    // This screen prints its own inline error.
    { reportErrors: false },
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

  const toSignIn = () => (router.canGoBack() ? router.back() : router.replace(routes.signIn));

  if (sent) {
    return (
      <AuthLayout eyebrow="Account help" title="Check your email" lead={`If an account exists for ${sent.email}, we sent it a link to set a new password.`}>
        <View style={[surface, styles.card]}>
          <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
            <PaperPlaneTilt size={24} color={colors.accent} weight="fill" />
          </View>
          <AppText tone="muted">The link works for 30 minutes and only once. If it does not arrive in a few minutes, check your spam folder or send it again.</AppText>
          {formError && <Notice tone="danger" message={formError} />}
          <Button label="Back to log in" size="lg" block onPress={toSignIn} />
          <Button label="Send again" variant="secondary" size="lg" block loading={request.isPending} onPress={() => void send()} />
        </View>

        {USE_MOCKS && sent.demoToken && (
          <View style={[styles.demo, { borderColor: colors.border }]}>
            <AppText variant="body-sm" tone="muted" style={styles.center}>
              Demo mode: there is no inbox here, so you can open the reset link directly.
            </AppText>
            <Button label="Open the reset link" variant="ghost" size="sm" onPress={() => router.push(routes.resetPassword(sent.demoToken!))} />
          </View>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Account help" title="Reset your password" lead="Enter the email you use to log in. We will send you a link to set a new password.">
      <View style={[surface, styles.card]}>
        {formError && <Notice tone="danger" message={formError} />}
        <TextField
          label="Email"
          icon={EnvelopeSimple}
          placeholder="you@yourfacility.com"
          value={form.values.email}
          onChangeText={(t) => form.set('email', t)}
          error={form.errors.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
          returnKeyType="send"
          onSubmitEditing={() => void send()}
        />
        <Button label="Send reset link" size="lg" block loading={request.isPending} onPress={() => void send()} />
      </View>

      <Pressable accessibilityRole="link" onPress={toSignIn} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <ArrowLeft size={14} color={colors.accent} weight="bold" />
        <AppText variant="body-sm" tone="accent" style={styles.link}>
          Back to log in
        </AppText>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.xl, gap: spacing.lg },
  icon: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  demo: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.card, padding: spacing.lg, gap: spacing.md, alignItems: 'center' },
  center: { textAlign: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  link: { fontFamily: fontFamily.semibold },
  pressed: { opacity: 0.6 },
});

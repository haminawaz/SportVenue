import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'phosphor-react-native';

import { ApiError } from '@/api/client';
import { toUserFacingError } from '@/api/errors';
import { USE_MOCKS } from '@/config/env';
import { AuthLayout } from '@/features/marketing/components/AuthLayout';
import { rules, useForm } from '@/lib/useForm';
import { useAuth } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/Fields';
import { Notice } from '@/ui/States';
import { useSurface } from '@/ui/surface';

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const surface = useSurface();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({ email: '', password: '' }, (v) => ({
    email: rules.email(v.email),
    password: rules.required(v.password, 'Enter your password.'),
  }));

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
    <AuthLayout title="Owner login" lead="Log in to see today’s bookings, payments and courts.">
      {formError && <Notice tone="danger" message={formError} />}

      <View style={[surface, styles.card]}>
        <TextField
          label="Email"
          value={form.values.email}
          onChangeText={(t) => form.set('email', t)}
          error={form.errors.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
          returnKeyType="next"
        />
        <TextField
          label="Password"
          value={form.values.password}
          onChangeText={(t) => form.set('password', t)}
          error={form.errors.password}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />
        <Button label="Log in" size="lg" block onPress={onSubmit} loading={submitting} />
      </View>

      <View style={styles.alt}>
        <AppText tone="muted">New to SportVenue?</AppText>
        <Pressable role="link" aria-label="Get started" onPress={() => router.push('/request-demo')} hitSlop={12} style={styles.link}>
          <AppText variant="body-strong" tone="accent">
            Get started
          </AppText>
          <ArrowRight size={16} color={colors.accent} weight="bold" />
        </Pressable>
      </View>

      {USE_MOCKS && (
        <Pressable
          role="button"
          aria-label="Fill in the sample owner account"
          onPress={() => form.patch({ email: 'hamid@baselinepadel.pk', password: 'sportvenue123' })}
          style={({ pressed }) => [styles.demo, { borderColor: colors.border }, pressed && { backgroundColor: colors.surfaceMuted }]}
        >
          <AppText variant="body-sm" tone="muted">
            Development build
          </AppText>
          <AppText variant="body-strong" tone="accent">
            Fill in the sample owner account
          </AppText>
        </Pressable>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.xl, gap: spacing.xl },
  alt: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 44 },
  demo: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.card, padding: spacing.lg, gap: spacing.xxs, alignItems: 'center' },
});

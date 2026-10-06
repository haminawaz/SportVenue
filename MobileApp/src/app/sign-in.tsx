import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { EnvelopeSimple, LockSimple } from 'phosphor-react-native';

import { ApiError } from '@/api/client';
import { toUserFacingError } from '@/api/errors';
import { USE_MOCKS } from '@/config/env';
import { AuthLayout } from '@/features/marketing/components/AuthLayout';
import { rules, useForm } from '@/lib/useForm';
import { useAuth } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily, radius, spacing } from '@/theme/tokens';
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
    <AuthLayout eyebrow="Welcome back" title="Owner login" lead="See today’s bookings, payments and courts in one place.">
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
          returnKeyType="next"
        />
        <TextField
          label="Password"
          icon={LockSimple}
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
        <AppText variant="body-sm" tone="muted">
          New to SportVenue?
        </AppText>
        <Pressable
          accessibilityRole="link"
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          onPress={() => router.push('/request-demo')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <AppText variant="body-sm" tone="accent" style={styles.link}>
            Get started
          </AppText>
        </Pressable>
      </View>

      {USE_MOCKS && (
        <View style={[styles.demo, { borderColor: colors.border }]}>
          <AppText variant="body-sm" tone="muted">
            Development build: sample owners
          </AppText>
          <View style={styles.demoRow}>
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
          </View>
        </View>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.xl, gap: spacing.lg + 2 },
  alt: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  link: { fontFamily: fontFamily.semibold },
  pressed: { opacity: 0.6 },
  demo: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.card, padding: spacing.lg, gap: spacing.md, alignItems: 'center' },
  demoRow: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
});

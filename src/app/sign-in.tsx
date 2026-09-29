import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { toUserFacingError } from '@/api/errors';
import { USE_MOCKS } from '@/config/env';
import { BrandMark } from '@/features/marketing/components/BrandMark';
import { rules, useForm } from '@/lib/useForm';
import { useAuth } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/Fields';
import { IconButton } from '@/ui/IconButton';
import { Notice } from '@/ui/States';
import { useSurface } from '@/ui/surface';

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const surface = useSurface();
  const insets = useSafeAreaInsets();
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

  const back = () => (router.canGoBack() ? router.back() : router.replace('/welcome'));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxxl }]} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <View style={styles.top}>
            <IconButton icon={ArrowLeft} label="Back to home" onPress={back} variant="filled" />
          </View>

          <View style={styles.titles}>
            <BrandMark size={44} withName={false} />
            <AppText variant="display" role="heading">
              Welcome back
            </AppText>
            <AppText tone="muted" style={styles.lead}>
              Log in to see today&rsquo;s bookings, payments and courts.
            </AppText>
          </View>

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
            <AppText tone="muted">New to CoyoteOS?</AppText>
            <Pressable role="link" aria-label="Request a demo" onPress={() => router.push('/request-demo')} hitSlop={12}>
              <AppText variant="bodyStrong" tone="accent">
                Request a demo
              </AppText>
            </Pressable>
          </View>

          {USE_MOCKS && (
            <Pressable
              role="button"
              aria-label="Fill in the sample owner account"
              onPress={() => form.patch({ email: 'hamid@baselinepadel.pk', password: 'coyote123' })}
              style={[styles.demo, { borderColor: colors.border }]}
            >
              <AppText variant="label" tone="muted">
                Development build
              </AppText>
              <AppText variant="bodyStrong" tone="accent">
                Fill in the sample owner account
              </AppText>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.xl },
  inner: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: spacing.xxl },
  top: { flexDirection: 'row' },
  titles: { gap: spacing.md },
  lead: { fontSize: 19, lineHeight: 28 },
  card: { padding: spacing.xl, gap: spacing.xl },
  alt: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', flexWrap: 'wrap' },
  demo: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: radius.card, padding: spacing.lg, gap: spacing.xxs, alignItems: 'center' },
});

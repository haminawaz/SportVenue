import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toUserFacingError } from '@/api/errors';
import { rules, useForm } from '@/lib/useForm';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Chip, ChipRow } from '@/ui/Chips';
import { FieldShell, TextField } from '@/ui/Fields';
import { IconButton } from '@/ui/IconButton';
import { Notice } from '@/ui/States';

import { useRequestDemo, type DemoRequest } from '../api';

type Values = Omit<DemoRequest, 'note'> & { note: string };

const COURTS = ['1-2', '3-5', '6-10', '11+'];

export function RequestDemoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const request = useRequestDemo();
  const [done, setDone] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<Values>(
    { name: '', facilityName: '', city: '', phone: '', email: '', courts: '3-5', note: '' },
    useCallback(
      (v: Values) => ({
        name: v.name.trim().length < 2 ? 'Enter your name.' : undefined,
        facilityName: v.facilityName.trim().length < 2 ? 'Enter your facility name.' : undefined,
        city: v.city.trim() ? undefined : 'Enter your city.',
        phone: rules.phone(v.phone),
        email: rules.email(v.email),
      }),
      [],
    ),
  );

  const submit = async () => {
    setSaving(true);
    setFormError(null);
    const ok = await form.submit(async (v) => {
      try {
        await request.mutateAsync({ ...v, note: v.note.trim() || undefined });
      } catch (e) {
        setFormError(toUserFacingError(e, "Couldn't send your request").message);
        throw e;
      }
    });
    setSaving(false);
    if (ok) setDone(form.values.name.trim().split(' ')[0]);
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/welcome'));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxxl }]} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <IconButton icon={ArrowLeft} label="Back" onPress={back} variant="filled" />

          {done ? (
            <View style={styles.done}>
              <View style={[styles.doneIcon, { backgroundColor: colors.accentSoft }]}>
                <CheckCircle size={44} color={colors.accent} weight="fill" />
              </View>
              <AppText variant="display" style={styles.center}>
                Thanks, {done}.
              </AppText>
              <AppText tone="muted" style={[styles.center, styles.lead]}>
                We have your details and will be in touch soon to set up a demo with your courts.
              </AppText>
              <Button label="Back to home" size="lg" variant="secondary" onPress={back} />
            </View>
          ) : (
            <>
              <View style={styles.titles}>
                <AppText variant="display" role="heading">
                  Request a demo
                </AppText>
                <AppText tone="muted" style={styles.lead}>
                  Tell us about your facility. We will set up CoyoteOS with your courts and show you around.
                </AppText>
              </View>

              {formError && <Notice tone="danger" message={formError} />}

              <View style={styles.form}>
                <TextField label="Your name" value={form.values.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} autoCapitalize="words" autoComplete="name" />
                <TextField label="Facility name" value={form.values.facilityName} onChangeText={(t) => form.set('facilityName', t)} error={form.errors.facilityName} autoCapitalize="words" />
                <TextField label="City" value={form.values.city} onChangeText={(t) => form.set('city', t)} error={form.errors.city} autoCapitalize="words" />
                <TextField label="Phone" value={form.values.phone} onChangeText={(t) => form.set('phone', t)} error={form.errors.phone} keyboardType="phone-pad" autoComplete="tel" />
                <TextField label="Email" value={form.values.email} onChangeText={(t) => form.set('email', t)} error={form.errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                <FieldShell label="How many courts?">
                  <ChipRow bleed={false}>
                    {COURTS.map((c) => (
                      <Chip key={c} label={c} selected={form.values.courts === c} onPress={() => form.set('courts', c)} />
                    ))}
                  </ChipRow>
                </FieldShell>
                <TextField label="Anything else?" optional multiline value={form.values.note} onChangeText={(t) => form.set('note', t)} maxLength={500} placeholder="For example: we run a padel league on weekends" />
                <Button label="Send request" size="lg" block onPress={submit} loading={saving} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.xl },
  inner: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: spacing.xxl },
  titles: { gap: spacing.md },
  lead: { fontSize: 19, lineHeight: 28 },
  form: { gap: spacing.xl },
  done: { alignItems: 'center', gap: spacing.lg, paddingTop: spacing.huge },
  doneIcon: { width: 88, height: 88, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});

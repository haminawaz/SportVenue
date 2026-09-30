import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle } from 'phosphor-react-native';

import { toUserFacingError } from '@/api/errors';
import { rules, useForm } from '@/lib/useForm';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Chip, ChipRow } from '@/ui/Chips';
import { FieldShell, TextField } from '@/ui/Fields';
import { Notice } from '@/ui/States';
import { useSurface } from '@/ui/surface';

import { useRequestDemo, type DemoRequest, type LeadIntent } from '../api';
import { AuthLayout } from '../components/AuthLayout';

type Values = Omit<DemoRequest, 'note' | 'intent'> & { note: string };

/** One form, three reasons to fill it in. */
const COPY: Record<LeadIntent, { title: string; lead: string; submit: string; done: string }> = {
  start: {
    title: 'Get started',
    lead: 'Tell us about your facility. We will set up SportVenue with your courts and walk you through it.',
    submit: 'Send details',
    done: 'We have your details and will be in touch soon to set up SportVenue with your courts.',
  },
  demo: {
    title: 'Book a demo',
    lead: 'Tell us about your facility and we will show you SportVenue running with courts like yours.',
    submit: 'Request demo',
    done: 'We have your details and will be in touch soon to arrange your demo.',
  },
  quote: {
    title: 'Get a quote',
    lead: 'Pricing depends on how many courts you run. Tell us about your facility and we will send you a quote.',
    submit: 'Request quote',
    done: 'We have your details and will send your quote soon.',
  },
};

const COURTS = ['1-2', '3-5', '6-10', '11+'];

/** Sign-up intake: the owner tells us about the facility, as a new account, a demo or a quote request. */
export function RequestDemoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ intent?: string }>();
  const intent: LeadIntent = params.intent === 'demo' || params.intent === 'quote' ? params.intent : 'start';
  const copy = COPY[intent];
  const { colors } = useTheme();
  const surface = useSurface();
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
        await request.mutateAsync({ ...v, intent, note: v.note.trim() || undefined });
      } catch (e) {
        setFormError(toUserFacingError(e, "Couldn't send your details").message);
        throw e;
      }
    });
    setSaving(false);
    if (ok) setDone(form.values.name.trim().split(' ')[0]);
  };

  const home = () => (router.canGoBack() ? router.back() : router.replace('/welcome'));

  if (done) {
    return (
      <AuthLayout>
        <View style={styles.done}>
          <View style={[styles.doneIcon, { backgroundColor: colors.accentSoft }]}>
            <CheckCircle size={44} color={colors.accent} weight="fill" />
          </View>
          <AppText variant="display-xl" role="heading" style={styles.center}>
            Thanks, {done}.
          </AppText>
          <AppText tone="muted" style={[styles.center, styles.lead]}>
            {copy.done}
          </AppText>
          <Button label="Back to home" size="lg" variant="secondary" onPress={home} />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={copy.title} lead={copy.lead}>
      {formError && <Notice tone="danger" message={formError} />}

      <View style={[surface, styles.form]}>
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
        <Button label={copy.submit} size="lg" block onPress={submit} loading={saving} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  lead: { maxWidth: 520 },
  form: { gap: spacing.xl, padding: spacing.xl },
  done: { alignItems: 'center', gap: spacing.lg, paddingTop: spacing.huge },
  doneIcon: { width: 88, height: 88, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});

import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Buildings, CheckCircle, EnvelopeSimple, MapPin, Phone, User } from 'phosphor-react-native';

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
const COPY: Record<LeadIntent, { eyebrow: string; title: string; lead: string; points: string[]; submit: string; done: string }> = {
  start: {
    eyebrow: 'Set up in an afternoon',
    title: 'Get started',
    lead: 'Tell us about your facility. We set up SportVenue with you.',
    points: ['We add your courts, hours and prices for you', 'A walkthrough of bookings and payments', 'One owner account for your whole facility'],
    submit: 'Send details',
    done: 'We have your details and will be in touch soon to set up SportVenue with your courts.',
  },
  demo: {
    eyebrow: 'See it first',
    title: 'Book a demo',
    lead: 'We will show you SportVenue running with courts like yours.',
    points: ['A live walkthrough of the app', 'Bookings, payments and pricing for your sport', 'Bring your questions, no commitment'],
    submit: 'Request demo',
    done: 'We have your details and will be in touch soon to arrange your demo.',
  },
  quote: {
    eyebrow: 'Pricing',
    title: 'Get a quote',
    lead: 'Plans depend on how many courts you run.',
    points: ['A price for your number of courts', 'Answers to your questions about plans', 'No commitment to ask'],
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
      <AuthLayout eyebrow={copy.eyebrow} title="Request sent">
        <View style={[surface, styles.done]}>
          <View style={[styles.doneIcon, { backgroundColor: colors.accentSoft }]}>
            <CheckCircle size={40} color={colors.accent} weight="fill" />
          </View>
          <AppText variant="display-md" role="heading" style={styles.center}>
            Thanks, {done}.
          </AppText>
          <AppText tone="muted" style={styles.center}>
            {copy.done}
          </AppText>
          <Button label="Back to home" size="lg" variant="secondary" block onPress={home} />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead} points={copy.points}>
      <View style={[surface, styles.card]}>
        {formError && <Notice tone="danger" message={formError} />}

        <FormGroup title="About you">
          <TextField label="Your name" icon={User} value={form.values.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} autoCapitalize="words" autoComplete="name" />
          <TextField
            label="Phone"
            icon={Phone}
            value={form.values.phone}
            onChangeText={(t) => form.set('phone', t)}
            error={form.errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="+92 300 1234567"
          />
          <TextField
            label="Email"
            icon={EnvelopeSimple}
            value={form.values.email}
            onChangeText={(t) => form.set('email', t)}
            error={form.errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@yourfacility.com"
          />
        </FormGroup>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <FormGroup title="Your facility">
          <TextField
            label="Facility name"
            icon={Buildings}
            value={form.values.facilityName}
            onChangeText={(t) => form.set('facilityName', t)}
            error={form.errors.facilityName}
            autoCapitalize="words"
          />
          <TextField label="City" icon={MapPin} value={form.values.city} onChangeText={(t) => form.set('city', t)} error={form.errors.city} autoCapitalize="words" />
          <FieldShell label="How many courts?">
            <ChipRow bleed={false}>
              {COURTS.map((c) => (
                <Chip key={c} label={c} selected={form.values.courts === c} onPress={() => form.set('courts', c)} />
              ))}
            </ChipRow>
          </FieldShell>
          <TextField
            label="Anything else?"
            optional
            multiline
            value={form.values.note}
            onChangeText={(t) => form.set('note', t)}
            maxLength={500}
            placeholder="For example: we run a padel league on weekends"
          />
        </FormGroup>

        <Button label={copy.submit} variant="accent" size="lg" block onPress={submit} loading={saving} />
      </View>

      <View style={styles.alt}>
        <AppText variant="body-sm" tone="muted">
          Already on SportVenue?
        </AppText>
        <Button label="Log in" variant="tertiary" size="sm" onPress={() => router.push('/sign-in')} />
      </View>
    </AuthLayout>
  );
}

function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText variant="caption-uppercase" tone="muted">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.xl, gap: spacing.xl },
  group: { gap: spacing.lg },
  divider: { height: StyleSheet.hairlineWidth },
  alt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  done: { alignItems: 'center', gap: spacing.md, padding: spacing.xxl },
  doneIcon: { width: 72, height: 72, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  center: { textAlign: 'center' },
});

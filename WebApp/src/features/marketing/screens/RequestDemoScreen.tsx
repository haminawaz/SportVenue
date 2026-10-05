'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Buildings, CheckCircle, EnvelopeSimple, MapPin, Phone, User } from '@phosphor-icons/react';

import { toUserFacingError } from '@/api/errors';
import { rules, useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { useAppRouter } from '@/navigation/useAppRouter';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { FieldShell, TextField } from '@/ui/Fields';
import { Notice } from '@/ui/States';
import { SegmentedControl } from '@/ui/Tabs';

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
  const router = useAppRouter();
  const params = useSearchParams();
  const raw = params.get('intent');
  const intent: LeadIntent = raw === 'demo' || raw === 'quote' ? raw : 'start';
  const copy = COPY[intent];
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

  const home = () => router.back(routes.welcome);

  if (done) {
    return (
      <AuthLayout eyebrow={copy.eyebrow} title="Request sent">
        <div className="surface-card flex flex-col items-center gap-3 p-8">
          <span className="mb-1 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent-soft text-accent">
            <CheckCircle size={40} weight="fill" aria-hidden />
          </span>
          <AppText as="h2" variant="display-md" className="text-center">
            Thanks, {done}.
          </AppText>
          <AppText variant="body-md" tone="muted" className="text-center">
            {copy.done}
          </AppText>
          <Button label="Back to home" size="lg" variant="secondary" block onPress={home} className="w-full" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead} points={copy.points}>
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {formError && <Notice tone="danger" message={formError} />}

        <FormGroup title="About you">
          <TextField label="Your name" icon={User} value={form.values.name} onChangeText={(t) => form.set('name', t)} error={form.errors.name} autoCapitalize="words" autoComplete="name" />
          <TextField label="Phone" icon={Phone} value={form.values.phone} onChangeText={(t) => form.set('phone', t)} error={form.errors.phone} type="tel" autoComplete="tel" placeholder="+92 300 1234567" />
          <TextField
            label="Email"
            icon={EnvelopeSimple}
            value={form.values.email}
            onChangeText={(t) => form.set('email', t)}
            error={form.errors.email}
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@yourfacility.com"
          />
        </FormGroup>

        <div aria-hidden className="h-px bg-border" />

        <FormGroup title="Your facility">
          <TextField label="Facility name" icon={Buildings} value={form.values.facilityName} onChangeText={(t) => form.set('facilityName', t)} error={form.errors.facilityName} autoCapitalize="words" autoComplete="organization" />
          <TextField label="City" icon={MapPin} value={form.values.city} onChangeText={(t) => form.set('city', t)} error={form.errors.city} autoCapitalize="words" autoComplete="address-level2" />
          <FieldShell label="How many courts?">
            <div>
              <SegmentedControl label="How many courts?" value={form.values.courts} options={COURTS.map((c) => ({ value: c, label: c }))} onChange={(c) => form.set('courts', c)} />
            </div>
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

        <Button type="submit" label={copy.submit} variant="accent" size="lg" block loading={saving} />
      </form>

      <div className="flex items-center justify-center gap-1">
        <AppText variant="body-sm" tone="muted">
          Already on SportVenue?
        </AppText>
        <Button label="Log in" variant="tertiary" size="sm" onPress={() => router.push(routes.signIn)} className="self-center" />
      </div>
    </AuthLayout>
  );
}

function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={title} className="flex flex-col gap-4">
      <AppText variant="caption-uppercase" tone="muted">
        {title}
      </AppText>
      {children}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { selectionBus } from '@/lib/selectionBus';
import { useForm } from '@/lib/useForm';
import { routes } from '@/navigation/routes';
import { useSession } from '@/session/SessionProvider';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/Fields';
import { Screen } from '@/ui/Screen';
import { Notice, QueryView } from '@/ui/States';

import { useBooking, useUpdateBooking } from '../api';
import { CustomerPicker } from '../components/CustomerPicker';
import type { BookingDetail } from '@/domain/types';

export function BookingEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useBooking(id);
  return (
    <>
      <Stack.Screen options={{ title: 'Edit booking' }} />
      <QueryView query={query} errorTitle="Couldn't load booking">
        {(b) => <EditForm booking={b} />}
      </QueryView>
    </>
  );
}

function EditForm({ booking: b }: { booking: BookingDetail }) {
  const router = useRouter();
  const { can } = useSession();
  const update = useUpdateBooking(b.id);
  const [saving, setSaving] = useState(false);
  const form = useForm(
    { customerId: b.customerId, notes: b.notes ?? '' },
    useCallback((v: { customerId: string; notes: string }) => ({ notes: v.notes.length > 500 ? 'Keep notes under 500 characters.' : undefined }), []),
  );
  const locked = b.paid > 0;

  const setField = form.set;
  useFocusEffect(
    useCallback(() => {
      const created = selectionBus.take('customer');
      if (created && !locked) setField('customerId', created);
    }, [setField, locked]),
  );

  useEffect(() => {
    if (b.status === 'CANCELLED') router.back();
  }, [b.status, router]);

  const save = async () => {
    setSaving(true);
    const ok = await form.submit((v) =>
      update.mutateAsync({ customerId: v.customerId !== b.customerId ? v.customerId : undefined, notes: v.notes }),
    );
    setSaving(false);
    if (ok) router.back();
  };

  return (
    <Screen keyboard footer={<Button label="Save changes" block onPress={save} loading={saving} disabled={!form.dirty} />}>
      {locked && <Notice message="A payment has been recorded, so the customer can't be changed. Cancel and rebook if it was booked under the wrong name." />}
      <CustomerPicker
        value={form.values.customerId}
        onChange={(id) => form.set('customerId', id)}
        disabled={locked}
        error={form.errors.customerId}
        onCreateNew={can('customer.manage') ? () => router.push(routes.customerNew({ returnTo: 'booking' })) : undefined}
      />
      <TextField label="Notes" optional multiline value={form.values.notes} onChangeText={(t) => form.set('notes', t)} error={form.errors.notes} maxLength={500} />
    </Screen>
  );
}

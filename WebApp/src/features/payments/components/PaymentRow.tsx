'use client';

import { memo } from 'react';

import { PAYMENT_METHOD } from '@/domain/labels';
import type { Payment } from '@/domain/types';
import { formatDayAndTime } from '@/lib/datetime';
import { useFormat } from '@/lib/format';
import { ListRow } from '@/ui/List';

type PaymentRowProps = { payment: Payment; onPress: (id: string) => void; showCustomer?: boolean };

export const PaymentRow = memo(function PaymentRow({ payment: p, onPress, showCustomer = true }: PaymentRowProps) {
  const f = useFormat();
  const method = PAYMENT_METHOD[p.method];
  const when = formatDayAndTime(p.receivedAt, f.timeZone, f.today());
  return (
    <ListRow
      icon={method.icon}
      title={showCustomer ? p.customerName : `${method.label} · ${p.bookingReference}`}
      subtitle={showCustomer ? `${method.label} · ${when}` : when}
      value={f.money(p.amount)}
      valueTone="default"
      label={`${f.moneyA11y(p.amount)} from ${p.customerName}, ${method.label}, booking ${p.bookingReference}, ${when}`}
      onPress={() => onPress(p.id)}
      titleLines={1}
    />
  );
});

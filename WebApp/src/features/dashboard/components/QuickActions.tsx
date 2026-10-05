import { CalendarPlus, Receipt, UserPlus } from '@phosphor-icons/react';

import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';

type QuickActionsProps = {
  onNewBooking: () => void;
  onRecordPayment: () => void;
  onNewCustomer: () => void;
};

/** One clear main action (New booking), then the two supporting ones. */
export function QuickActions({ onNewBooking, onRecordPayment, onNewCustomer }: QuickActionsProps) {
  return (
    <Card padded={false}>
      <CardHeader title="Quick actions" />
      <div className="flex flex-col gap-2 p-4">
        <Button label="New booking" icon={CalendarPlus} size="lg" block onPress={onNewBooking} />
        <div className="grid grid-cols-2 gap-2">
          <Button label="Record payment" icon={Receipt} variant="secondary" block onPress={onRecordPayment} />
          <Button label="Add customer" icon={UserPlus} variant="secondary" block onPress={onNewCustomer} />
        </div>
      </div>
    </Card>
  );
}

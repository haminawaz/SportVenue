import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CalendarX } from 'phosphor-react-native';

import { useAvailability, useCourts } from '@/features/courts/api';
import { addDays, addMinutesLocal, formatTime, type CalendarDate } from '@/lib/datetime';
import { formatDuration, useFormat } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Chip, ChipRow } from '@/ui/Chips';
import { DateField } from '@/ui/DateField';
import { FieldShell } from '@/ui/Fields';
import { Skeleton } from '@/ui/Skeleton';
import { EmptyState } from '@/ui/EmptyState';

export type SlotValue = { courtId?: string; date: CalendarDate; durationMinutes: number; startAt?: string };

const DURATIONS = [60, 90, 120];

type SlotPickerProps = {
  value: SlotValue;
  onChange: (v: SlotValue) => void;
  /** When rescheduling, the booking's own slots count as free. */
  ignoreBookingId?: string;
  courtError?: string;
  slotError?: string;
};

/**
 * Court, date, length and start time in one flow. Start times come from the
 * server's availability for that court and day; the server re-validates on save.
 */
export function SlotPicker({ value, onChange, ignoreBookingId, courtError, slotError }: SlotPickerProps) {
  const { colors } = useTheme();
  const f = useFormat();
  const today = f.today();
  const courts = useCourts(['ACTIVE']);
  const availability = useAvailability(value.courtId, value.date);

  const starts = useMemo(() => {
    const slots = availability.data?.slots ?? [];
    const step = availability.data?.slotMinutes ?? 60;
    const need = Math.ceil(value.durationMinutes / step);
    const usable = (i: number) => slots[i] && (slots[i].status === 'FREE' || (ignoreBookingId && slots[i].bookingId === ignoreBookingId));
    const out: { startAt: string; rate?: number }[] = [];
    for (let i = 0; i + need <= slots.length; i++) {
      let ok = true;
      for (let k = 0; k < need; k++) if (!usable(i + k)) ok = false;
      if (ok) out.push({ startAt: slots[i].startAt, rate: slots[i].rate });
    }
    return out;
  }, [availability.data, value.durationMinutes, ignoreBookingId]);

  const set = (patch: Partial<SlotValue>) => onChange({ ...value, startAt: undefined, ...patch });

  return (
    <View style={styles.root}>
      <FieldShell label="Court" error={courtError}>
        {courts.isPending ? (
          <Skeleton height={36} width="70%" radius={radius.control} />
        ) : (courts.data ?? []).length === 0 ? (
          <AppText tone="muted">No courts are open for booking. Set a court to active first.</AppText>
        ) : (
          <ChipRow>
            {(courts.data ?? []).map((c) => (
              <Chip key={c.id} label={`${c.name} · ${c.sport}`} selected={c.id === value.courtId} onPress={() => set({ courtId: c.id })} />
            ))}
          </ChipRow>
        )}
      </FieldShell>

      <DateField label="Date" value={value.date} minimumDate={today} maximumDate={addDays(today, 90)} onChange={(date) => set({ date })} />

      <FieldShell label="Length">
        <ChipRow bleed={false}>
          {DURATIONS.map((d) => (
            <Chip key={d} label={formatDuration(d)} selected={d === value.durationMinutes} onPress={() => set({ durationMinutes: d })} />
          ))}
        </ChipRow>
      </FieldShell>

      <FieldShell label="Start time" error={slotError}>
        {!value.courtId ? (
          <AppText tone="muted">Choose a court to see open times.</AppText>
        ) : availability.isPending ? (
          <View style={styles.grid} accessible role="progressbar" aria-label="Loading open times">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} width="30%" height={52} radius={radius.control} />
            ))}
          </View>
        ) : availability.isError ? (
          <AppText tone="danger" role="alert">
            Couldn’t load open times. Pull down or pick the date again.
          </AppText>
        ) : starts.length === 0 ? (
          <EmptyState compact icon={CalendarX} title="No open times" message={`Nothing free for ${formatDuration(value.durationMinutes)} on this day. Try another day, court or a shorter game.`} />
        ) : (
          <View style={styles.grid} role="radiogroup" aria-label="Start time">
            {starts.map((s) => {
              const on = s.startAt === value.startAt;
              const label = formatTime(s.startAt, f.timeZone);
              const end = formatTime(addMinutesLocal(s.startAt, value.durationMinutes), f.timeZone);
              return (
                <Pressable
                  key={s.startAt}
                  role="radio"
                  aria-checked={on}
                  aria-label={`${label} to ${end}`}
                  onPress={() => onChange({ ...value, startAt: s.startAt })}
                  style={({ pressed }) => [
                    styles.slot,
                    { backgroundColor: on ? colors.accent : colors.surface, borderColor: on ? colors.accent : colors.border },
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <AppText variant="bodyStrong" numeric style={{ color: on ? colors.onAccent : colors.text }}>
                    {label}
                  </AppText>
                  <AppText variant="caption" numeric style={{ color: on ? colors.onAccent : colors.textMuted }}>
                    to {end}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        )}
      </FieldShell>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 52,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});

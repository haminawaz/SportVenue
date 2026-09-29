import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Check, UserPlus } from 'phosphor-react-native';

import { useCustomer, useCustomers } from '@/features/customers/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Avatar } from '@/ui/Avatar';
import { BottomSheet } from '@/ui/BottomSheet';
import { PickerField } from '@/ui/Fields';
import { SearchBar } from '@/ui/SearchBar';

type CustomerPickerProps = {
  value: string | undefined;
  onChange: (customerId: string) => void;
  error?: string;
  disabled?: boolean;
  helper?: string;
  onCreateNew?: () => void;
};

/** Search-as-you-type customer selector, with a shortcut to add someone new. */
export function CustomerPicker({ value, onChange, error, disabled, helper, onCreateNew }: CustomerPickerProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const selected = useCustomer(value ?? '');
  const list = useCustomers({ q: debounced, filter: 'active', sort: 'recent' });
  const items = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data]);

  return (
    <>
      <PickerField
        label="Customer"
        value={value ? (selected.data ? `${selected.data.name} · ${selected.data.phone}` : 'Loading...') : undefined}
        placeholder="Choose a customer"
        onPress={() => setOpen(true)}
        error={error}
        helper={helper}
        disabled={disabled}
        leading={value && selected.data ? <Avatar name={selected.data.name} size={28} /> : undefined}
      />
      <BottomSheet visible={open} title="Choose a customer" onClose={() => setOpen(false)}>
        <View style={styles.search}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search by name or phone" />
        </View>
        {onCreateNew && (
          <Pressable
            role="button"
            aria-label="Add a new customer"
            onPress={() => {
              setOpen(false);
              onCreateNew();
            }}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}
          >
            <View style={[styles.newIcon, { backgroundColor: colors.accentSoft }]}>
              <UserPlus size={18} color={colors.accent} />
            </View>
            <AppText variant="bodyStrong" tone="accent">
              Add a new customer
            </AppText>
          </Pressable>
        )}
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
          ListEmptyComponent={
            list.isPending ? (
              <ActivityIndicator style={styles.pad} color={colors.accent} accessibilityLabel="Loading customers" />
            ) : (
              <AppText tone="muted" style={styles.pad}>
                {debounced ? `No customers match "${debounced}".` : 'No active customers yet.'}
              </AppText>
            )
          }
          renderItem={({ item }) => {
            const on = item.id === value;
            return (
              <Pressable
                role="radio"
                aria-checked={on}
                aria-label={`${item.name}, ${item.phone}${item.isRegular ? ', regular' : ''}`}
                onPress={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}
              >
                <Avatar name={item.name} size={36} />
                <View style={styles.flex}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {item.name}
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={1}>
                    {item.phone}
                    {item.isRegular ? ' · Regular' : ''}
                  </AppText>
                </View>
                {on && <Check size={18} color={colors.accent} weight="bold" />}
              </Pressable>
            );
          }}
        />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: spacing.sm },
  list: { maxHeight: 380 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderRadius: radius.control, minHeight: 52 },
  newIcon: { width: 36, height: 36, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  pad: { padding: spacing.lg, textAlign: 'center' },
});

import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { PickerField } from './Fields';
import { SearchBar } from './SearchBar';

export type Option<V extends string> = { value: V; label: string; description?: string; disabled?: boolean };

type OptionSheetProps<V extends string> = {
  visible: boolean;
  title: string;
  options: Option<V>[];
  selected: V[];
  multiple?: boolean;
  searchable?: boolean;
  onClose: () => void;
  onChange: (values: V[]) => void;
};

/** Single select closes on tap. Multi select confirms with a Done button. */
export function OptionSheet<V extends string>({ visible, title, options, selected, multiple, searchable, onClose, onChange }: OptionSheetProps<V>) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<V[]>(selected);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const toggle = (v: V) => {
    if (!multiple) {
      onChange([v]);
      onClose();
      return;
    }
    setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));
  };

  const current = multiple ? draft : selected;

  return (
    <BottomSheet
      visible={visible}
      title={title}
      onClose={() => {
        setQuery('');
        onClose();
      }}
      onShow={() => setDraft(selected)}
    >
      {searchable && (
        <View style={styles.search}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search" />
        </View>
      )}
      <FlatList
        data={shown}
        keyExtractor={(o) => o.value}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        role={multiple ? 'list' : 'radiogroup'}
        ListEmptyComponent={
          <AppText tone="muted" style={styles.empty}>
            No matches for &ldquo;{query}&rdquo;.
          </AppText>
        }
        renderItem={({ item }) => {
          const on = current.includes(item.value);
          return (
            <Pressable
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={on}
              aria-label={item.description ? `${item.label}, ${item.description}` : item.label}
              aria-disabled={item.disabled}
              disabled={item.disabled}
              onPress={() => toggle(item.value)}
              style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.surfaceMuted }, item.disabled && { opacity: 0.45 }]}
            >
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{item.label}</AppText>
                {item.description && (
                  <AppText variant="caption" tone="muted">
                    {item.description}
                  </AppText>
                )}
              </View>
              {on && <Check size={22} color={colors.accent} weight="bold" />}
            </Pressable>
          );
        }}
      />
      {multiple && (
        <View style={styles.footer}>
          <Button label="Clear" variant="secondary" onPress={() => setDraft([])} />
          <Button
            label="Done"
            block
            onPress={() => {
              onChange(draft);
              onClose();
            }}
          />
        </View>
      )}
    </BottomSheet>
  );
}

type SelectFieldProps<V extends string> = {
  label: string;
  value: V | undefined;
  options: Option<V>[];
  onChange: (v: V) => void;
  placeholder?: string;
  helper?: string;
  error?: string;
  optional?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  sheetTitle?: string;
};

export function SelectField<V extends string>({ label, value, options, onChange, placeholder = 'Choose', sheetTitle, searchable, ...rest }: SelectFieldProps<V>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <>
      <PickerField label={label} value={selected?.label} placeholder={placeholder} onPress={() => setOpen(true)} {...rest} />
      <OptionSheet
        visible={open}
        title={sheetTitle ?? label}
        options={options}
        selected={value ? [value] : []}
        searchable={searchable ?? options.length > 8}
        onClose={() => setOpen(false)}
        onChange={(v) => v[0] && onChange(v[0])}
      />
    </>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: spacing.sm },
  list: { maxHeight: 460 },
  option: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.control,
  },
  flex: { flex: 1 },
  empty: { padding: spacing.lg, textAlign: 'center' },
  footer: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});

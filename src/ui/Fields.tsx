import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View, type TextInputProps } from 'react-native';
import { CaretDown, Eye, EyeSlash } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily, radius, spacing, touchTarget } from '@/theme/tokens';

import { AppText } from './AppText';

type FieldShellProps = { label: string; helper?: string; error?: string; children: ReactNode; optional?: boolean };

/** Label above, helper and error below. */
export function FieldShell({ label, helper, error, children, optional }: FieldShellProps) {
  return (
    <View style={styles.field}>
      <AppText variant="bodyStrong">
        {label}
        {optional ? <AppText variant="label" tone="muted">{'  Optional'}</AppText> : null}
      </AppText>
      {children}
      {helper && !error ? (
        <AppText variant="caption" tone="muted">
          {helper}
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="label" tone="danger" role="alert">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

type TextFieldProps = Omit<TextInputProps, 'style' | 'onChange'> & {
  label: string;
  helper?: string;
  error?: string;
  optional?: boolean;
  /** Fixed text before the input, such as a currency code. */
  prefix?: string;
  suffix?: string;
};

export function TextField({ label, helper, error, optional, prefix, suffix, secureTextEntry, multiline, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const borderColor = error ? colors.danger : focused ? colors.accent : colors.border;

  return (
    <FieldShell label={label} helper={helper} error={error} optional={optional}>
      <View style={[styles.inputBox, multiline && styles.multiline, { backgroundColor: colors.surface, borderColor }]}>
        {prefix && (
          <AppText variant="bodyStrong" tone="muted">
            {prefix}
          </AppText>
        )}
        <TextInput
          {...rest}
          aria-label={label}
          aria-invalid={!!error}
          secureTextEntry={hidden}
          multiline={multiline}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.accent}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, { color: colors.text, fontFamily: fontFamily.regular }, multiline && styles.inputMultiline]}
          maxFontSizeMultiplier={1.5}
        />
        {suffix && (
          <AppText variant="bodyStrong" tone="muted">
            {suffix}
          </AppText>
        )}
        {secureTextEntry && (
          <Pressable role="button" aria-label={hidden ? 'Show password' : 'Hide password'} onPress={() => setHidden((h) => !h)} hitSlop={12}>
            {hidden ? <Eye size={24} color={colors.textMuted} /> : <EyeSlash size={24} color={colors.textMuted} />}
          </Pressable>
        )}
      </View>
    </FieldShell>
  );
}

type PickerFieldProps = {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  helper?: string;
  error?: string;
  optional?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
};

/** Looks like an input; opens a sheet or picker. */
export function PickerField({ label, value, placeholder, onPress, helper, error, optional, disabled, leading }: PickerFieldProps) {
  const { colors } = useTheme();
  return (
    <FieldShell label={label} helper={helper} error={error} optional={optional}>
      <Pressable
        role="button"
        aria-label={`${label}: ${value ?? 'not set'}`}
        aria-disabled={disabled}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.inputBox,
          { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: error ? colors.danger : colors.border },
          disabled && { opacity: 0.55 },
        ]}
      >
        {leading}
        <AppText variant="body" tone={value ? 'default' : 'subtle'} numberOfLines={1} style={styles.flex}>
          {value ?? placeholder}
        </AppText>
        <CaretDown size={18} color={colors.textMuted} weight="bold" />
      </Pressable>
    </FieldShell>
  );
}

type SwitchRowProps = { label: string; description?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean };

export function SwitchRow({ label, description, value, onChange, disabled }: SwitchRowProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.switchRow, disabled && { opacity: 0.5 }]}>
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        {description && (
          <AppText variant="caption" tone="muted">
            {description}
          </AppText>
        )}
      </View>
      <Switch
        aria-label={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: colors.accent, false: colors.track }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.track}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  inputBox: {
    minHeight: touchTarget + 4,
    borderRadius: radius.control,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  multiline: { alignItems: 'flex-start', paddingVertical: spacing.sm },
  input: { flex: 1, fontSize: 17, paddingVertical: spacing.md, minHeight: touchTarget },
  inputMultiline: { minHeight: 112, textAlignVertical: 'top' },
  flex: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, minHeight: 68, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
});

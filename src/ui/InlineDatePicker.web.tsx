import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily, radius, spacing, touchTarget } from '@/theme/tokens';

import type { InlineDatePickerProps } from './InlineDatePicker';

/** Web: the community date picker has no web build, so use the browser's date input. */
export function InlineDatePicker({ value, minimumDate, maximumDate, accentColor, onChange }: InlineDatePickerProps) {
  const { colors, scheme } = useTheme();
  return (
    <input
      type="date"
      aria-label="Date"
      value={value}
      min={minimumDate}
      max={maximumDate}
      onChange={(e) => e.target.value && onChange(e.target.value)}
      style={{
        minHeight: touchTarget,
        padding: `0 ${spacing.md}px`,
        borderRadius: radius.control,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
        color: colors.text,
        accentColor,
        colorScheme: scheme,
        fontFamily: fontFamily.regular,
        fontSize: 16,
      }}
    />
  );
}

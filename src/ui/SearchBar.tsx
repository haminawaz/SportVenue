import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MagnifyingGlass, XCircle } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily, radius, spacing, touchTarget } from '@/theme/tokens';

import { useSurface } from './surface';

type SearchBarProps = { value: string; onChange: (v: string) => void; placeholder: string; label?: string };

export function SearchBar({ value, onChange, placeholder, label }: SearchBarProps) {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <View style={[surface, styles.box]}>
      <MagnifyingGlass size={22} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        selectionColor={colors.accent}
        aria-label={label ?? placeholder}
        role="searchbox"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        style={[styles.input, { color: colors.text, fontFamily: fontFamily.regular }]}
        maxFontSizeMultiplier={1.5}
      />
      {value.length > 0 && (
        <Pressable role="button" aria-label="Clear search" onPress={() => onChange('')} hitSlop={12}>
          <XCircle size={22} color={colors.textMuted} weight="fill" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { minHeight: touchTarget + 4, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  input: { flex: 1, fontSize: 17, paddingVertical: spacing.md },
});

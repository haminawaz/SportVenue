import { StyleSheet, View } from 'react-native';

import { initials } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

import { AppText } from './AppText';

/** Initials monogram. Decorative: always sits next to the full name. */
export function Avatar({ name, size = 44, tone = 'neutral' }: { name: string; size?: number; tone?: 'neutral' | 'accent' }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, { width: size, height: size, borderRadius: radius.full, backgroundColor: tone === 'accent' ? colors.accentSoft : colors.surfaceMuted }]}
    >
      <AppText variant={size >= 56 ? 'title-md' : 'nav-link'} style={{ color: tone === 'accent' ? colors.accent : colors.textMuted }}>
        {initials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});

import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { IconButton } from '@/ui/IconButton';

import { BrandMark } from './BrandMark';

type AuthLayoutProps = {
  title?: string;
  lead?: string;
  children: ReactNode;
};

/** Shared frame for the signed-out forms (Log in, Get started): back, brand, title, then the form. */
export function AuthLayout({ title, lead, children }: AuthLayoutProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/welcome'));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <View style={styles.top}>
            <IconButton icon={ArrowLeft} label="Back to home" onPress={back} variant="filled" />
            <BrandMark size={30} />
            <View style={styles.spacer} />
          </View>

          {title && (
            <View style={styles.titles}>
              <AppText variant="display-xl" role="heading">
                {title}
              </AppText>
              {lead && (
                <AppText tone="muted" style={styles.lead}>
                  {lead}
                </AppText>
              )}
            </View>
          )}

          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.xl },
  inner: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.xxl },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 60 },
  spacer: { width: 52 },
  titles: { gap: spacing.md, marginTop: spacing.sm },
  lead: { maxWidth: 520 },
});

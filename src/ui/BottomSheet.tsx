import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { useReducedMotion } from './useReducedMotion';

type BottomSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onShow?: () => void;
  children: ReactNode;
};

export function BottomSheet({ visible, title, onClose, onShow, children }: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduced ? 'none' : 'slide'}
      onRequestClose={onClose}
      onShow={onShow}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }]} onPress={onClose} aria-label="Close" role="button" />
        <View
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, spacing.lg), maxHeight: '88%' }]}
          aria-modal
          role="dialog"
          aria-label={title}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <AppText variant="heading" role="heading" style={styles.title}>
            {title}
          </AppText>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  handle: { width: 44, height: 5, borderRadius: radius.full, alignSelf: 'center', marginBottom: spacing.md },
  title: { marginBottom: spacing.lg },
});

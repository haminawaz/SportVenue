import type { ComponentType, ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import type { IconProps } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, touchTarget } from '@/theme/tokens';

import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { useReducedMotion } from './useReducedMotion';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Extra inputs, for example a reason picker. */
  children?: ReactNode;
};

export function ConfirmDialog({ visible, title, message, confirmLabel, cancelLabel = 'Keep', destructive, loading, onConfirm, onCancel, children }: ConfirmDialogProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  return (
    <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onCancel} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
        <View role="alert" aria-modal aria-label={title} style={[styles.dialog, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <AppText variant="title" role="heading" style={{ fontSize: 24, lineHeight: 30 }}>
            {title}
          </AppText>
          {message && <AppText tone="muted">{message}</AppText>}
          {children}
          <View style={styles.actions}>
            <Button label={cancelLabel} variant="secondary" onPress={onCancel} disabled={loading} block />
            <Button label={confirmLabel} onPress={onConfirm} loading={loading} block variant={destructive ? 'danger' : 'primary'} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export type SheetAction = { key: string; label: string; icon?: ComponentType<IconProps>; onPress: () => void; destructive?: boolean; description?: string };

export function ActionSheet({ visible, title, actions, onClose }: { visible: boolean; title: string; actions: SheetAction[]; onClose: () => void }) {
  const { colors } = useTheme();
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <View>
        {actions.map((a) => {
          const Icon = a.icon;
          const color = a.destructive ? colors.danger : colors.text;
          return (
            <Pressable
              key={a.key}
              role="button"
              aria-label={a.label}
              onPress={() => {
                onClose();
                a.onPress();
              }}
              style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceMuted }]}
            >
              {Icon && <Icon size={24} color={color} />}
              <View style={styles.flex}>
                <AppText variant="bodyStrong" style={{ color }}>
                  {a.label}
                </AppText>
                {a.description && (
                  <AppText variant="caption" tone="muted">
                    {a.description}
                  </AppText>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.sheet,
    padding: spacing.xxl,
    gap: spacing.lg,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { minHeight: touchTarget + 12, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radius.control },
  flex: { flex: 1 },
});

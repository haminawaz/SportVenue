import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { CheckCircle, WarningCircle } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, zIndex } from '@/theme/tokens';

import { AppText } from './AppText';
import { useReducedMotion } from './useReducedMotion';

type ToastKind = 'success' | 'error';
type ToastMessage = { id: number; kind: ToastKind; text: string };

type ToastApi = { show: (text: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastApi>({ show: () => {} });

const VISIBLE_MS = 3200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const counter = useRef(0);

  const show = useCallback((text: string, kind: ToastKind = 'success') => {
    counter.current += 1;
    setToast({ id: counter.current, kind, text });
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && <ToastView key={toast.id} toast={toast} onDone={() => setToast(null)} />}
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onDone }: { toast: ToastMessage; onDone: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(reduced ? 1 : 0));

  useEffect(() => {
    const enter = Animated.timing(progress, { toValue: 1, duration: reduced ? 0 : 220, useNativeDriver: true });
    enter.start();
    const timer = setTimeout(() => {
      Animated.timing(progress, { toValue: 0, duration: reduced ? 0 : 180, useNativeDriver: true }).start(() => onDone());
    }, VISIBLE_MS);
    return () => {
      enter.stop();
      clearTimeout(timer);
    };
  }, [progress, reduced, onDone]);

  const Icon = toast.kind === 'success' ? CheckCircle : WarningCircle;
  const iconColor = toast.kind === 'success' ? colors.accent : colors.danger;

  return (
    <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + spacing.lg }]}>
      <Animated.View
        role="alert"
        aria-live="polite"
        style={[
          styles.toast,
          { backgroundColor: colors.text, shadowColor: colors.shadow },
          { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
        ]}
      >
        <Icon size={24} color={iconColor} weight="fill" />
        <AppText variant="body-strong" style={[styles.text, { color: colors.background }]}>
          {toast.text}
        </AppText>
      </Animated.View>
    </View>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center', zIndex: zIndex.toast },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    maxWidth: 480,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: { flexShrink: 1 },
});

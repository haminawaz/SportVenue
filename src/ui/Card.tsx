import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '@/theme/tokens';

import { useSurface, type SurfaceTint } from './surface';
import { useReducedMotion } from './useReducedMotion';

type CardProps = { children: ReactNode; tint?: SurfaceTint; style?: StyleProp<ViewStyle> };

export function Card({ children, tint = 'surface', style }: CardProps) {
  return <View style={[useSurface(tint), styles.pad, style]}>{children}</View>;
}

type PressableCardProps = Omit<PressableProps, 'style' | 'children'> & CardProps;

/** A card that opens something. Always pass an aria-label describing the destination. */
export function PressableCard({ children, tint = 'surface', style, ...rest }: PressableCardProps) {
  const surface = useSurface(tint);
  const reduced = useReducedMotion();
  return (
    <Pressable role="button" style={({ pressed }) => [surface, styles.pad, pressed && (reduced ? styles.pressedFlat : styles.pressed), style]} {...rest}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.xl },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  pressedFlat: { opacity: 0.85 },
});

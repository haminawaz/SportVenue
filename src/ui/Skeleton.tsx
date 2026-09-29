import { useEffect, useState } from 'react';
import { Animated, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius as radii } from '@/theme/tokens';

import { useReducedMotion } from './useReducedMotion';

type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Placeholder block. Pulses gently to signal loading; static under reduced motion. */
export function Skeleton({ width = '100%', height, radius = radii.badge, style }: SkeletonProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, opacity]);

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.skeleton, opacity }, style]} />;
}

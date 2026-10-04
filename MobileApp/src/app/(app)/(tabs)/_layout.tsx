import type { ComponentType, ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View, type AccessibilityState, type ColorValue, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Tabs } from 'expo-router';
import { CalendarBlank, DotsThreeCircle, House, UsersThree, Wallet, type IconProps } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

const BAR_HEIGHT = 72;

/**
 * The owner's five daily destinations, in a floating pill that sits above the
 * home indicator. Courts, pricing, analytics and the rest live under More so
 * the bar never needs to shrink its labels.
 */
export default function TabsLayout() {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const narrow = width < 380;
  const gap = narrow ? 8 : 16;
  const bottom = Math.max(insets.bottom, Platform.OS === 'web' ? 14 : 10);

  const icon = (Icon: ComponentType<IconProps>) =>
    function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
      return (
        <View style={[styles.iconWrap, focused && { backgroundColor: colors.surfaceMuted }]}>
          <Icon size={24} color={color as string} weight={focused ? 'fill' : 'regular'} />
        </View>
      );
    };

  // Labels may run slightly wider than their slot ("Customers" at 360pt) instead of truncating;
  // the neighbouring labels are short, so nothing collides.
  const label = ({ color, children }: { color: ColorValue; children: string }) => (
    <View style={styles.labelBox}>
      <AppText variant="caption" numberOfLines={1} style={[styles.label, { color: color as string }]}>
        {children}
      </AppText>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          position: 'relative',
          backgroundColor: colors.surfaceRaised,
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          height: BAR_HEIGHT,
          paddingTop: 8,
          paddingBottom: 8,
          marginHorizontal: gap,
          marginBottom: bottom,
          borderRadius: radius.full,
          width: Math.min(width - gap * 2, 560),
          alignSelf: 'center',
          shadowColor: colors.shadow,
          ...(scheme === 'light' ? elevation.nav : { elevation: 0, shadowOpacity: 0 }),
        },
        // No side padding inside items, so "Customers" fits at 360pt.
        tabBarItemStyle: { borderRadius: radius.full, paddingHorizontal: 0 },
        tabBarLabel: label,
        tabBarButton: (props) => <TabButton {...props} />,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon(House) }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: icon(CalendarBlank) }} />
      <Tabs.Screen name="payments" options={{ title: 'Payments', tabBarIcon: icon(Wallet) }} />
      <Tabs.Screen name="customers" options={{ title: 'Customers', tabBarIcon: icon(UsersThree) }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon(DotsThreeCircle) }} />
    </Tabs>
  );
}

type TabButtonProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: ((e: GestureResponderEvent) => void) | null;
  onLongPress?: ((e: GestureResponderEvent) => void) | null;
  accessibilityState?: AccessibilityState;
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * Plain tab button: no platform ripple or highlight across the whole slot
 * (Android draws a large one by default). Pressing just dims the icon and
 * label; the selected pill behind the icon marks the active tab.
 */
function TabButton({ children, style, onPress, onLongPress, accessibilityState, accessibilityLabel, testID }: TabButtonProps) {
  return (
    <Pressable
      role="tab"
      aria-selected={accessibilityState?.selected}
      aria-label={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={null}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  iconWrap: { width: 48, height: 30, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  // The wrapper sets the width; text alone is capped at its parent's width on web.
  labelBox: { width: 76, alignSelf: 'center', alignItems: 'center', marginTop: 2 },
  label: { textAlign: 'center' },
});

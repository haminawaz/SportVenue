import type { ComponentType } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { CalendarBlank, DotsThreeCircle, House, UsersThree, Wallet, type IconProps } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { elevation, radius, typography } from '@/theme/tokens';

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
  const gap = narrow ? 10 : 16;
  const bottom = Math.max(insets.bottom, Platform.OS === 'web' ? 14 : 10);

  const icon = (Icon: ComponentType<IconProps>) =>
    function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
      return (
        <View style={[styles.iconWrap, focused && { backgroundColor: colors.surfaceMuted }]}>
          <Icon size={24} color={color as string} weight={focused ? 'fill' : 'regular'} />
        </View>
      );
    };

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
        tabBarItemStyle: { borderRadius: radius.full },
        tabBarLabelStyle: { ...typography.caption, marginTop: 2 },
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

const styles = StyleSheet.create({
  iconWrap: { width: 48, height: 30, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});

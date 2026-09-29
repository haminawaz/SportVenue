import { Platform, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { CalendarBlank, CourtBasketball, DotsThreeCircle, House, UsersThree } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/tokens';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { can } = useSession();
  const insets = useSafeAreaInsets();
  // Five labels must fit on a 320-375pt phone without truncating.
  const narrow = useWindowDimensions().width < 380;
  const bottom = Math.max(insets.bottom, Platform.OS === 'web' ? 10 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64 + bottom,
          paddingTop: 8,
          paddingBottom: bottom,
        },
        tabBarLabelStyle: { fontFamily: fontFamily.semibold, fontSize: narrow ? 10.5 : 12, lineHeight: 16, marginTop: 2 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <House size={26} color={color as string} weight={focused ? 'fill' : 'regular'} /> }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          href: can('booking.view') ? undefined : null,
          tabBarIcon: ({ color, focused }) => <CalendarBlank size={26} color={color as string} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="courts"
        options={{
          title: 'Courts',
          href: can('court.view') ? undefined : null,
          tabBarIcon: ({ color, focused }) => <CourtBasketball size={26} color={color as string} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          href: can('customer.view') ? undefined : null,
          tabBarIcon: ({ color, focused }) => <UsersThree size={26} color={color as string} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ color, focused }) => <DotsThreeCircle size={26} color={color as string} weight={focused ? 'fill' : 'regular'} /> }}
      />
    </Tabs>
  );
}

import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/tokens';

/** Signed-in area: tabs at the root, every detail and form pushed on top. */
export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fontFamily.semibold, fontSize: 19, color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

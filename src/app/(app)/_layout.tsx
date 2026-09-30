import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';

/** Signed-in area: tabs at the root, every detail and form pushed on top. */
export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleAlign: 'center',
        headerTitleStyle: { fontFamily: typography['title-md'].fontFamily, fontSize: typography['title-md'].fontSize, color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

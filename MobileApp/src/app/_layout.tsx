import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { BricolageGrotesque_300Light, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans';
import { useFonts } from 'expo-font';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { bindAppStateToQueryFocus, createQueryClient } from '@/api/queryClient';
import { SessionProvider, useAuth } from '@/session/SessionProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { bindNetworkToQueries, OfflineBanner } from '@/ui/OfflineBanner';
import { ToastProvider } from '@/ui/Toast';

function RootNavigator() {
  const { status } = useAuth();
  const { scheme, colors } = useTheme();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} accessibilityLabel="Loading" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        {/* Signed-out visitors land on the marketing page first. */}
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="request-demo" />
        </Stack.Protected>
      </Stack>
      <OfflineBanner />
    </View>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  // If fonts fail to load we still render with the system font rather than blocking the app.
  const [fontsLoaded, fontError] = useFonts({
    // Registered under the family names the type scale uses (theme/tokens.ts).
    'BricolageGrotesque-Light': BricolageGrotesque_300Light,
    // Logo only: the SPORTVENUE wordmark and the scoreboard letters.
    'BricolageGrotesque-ExtraBold': BricolageGrotesque_800ExtraBold,
    'InstrumentSans-Regular': InstrumentSans_400Regular,
    'InstrumentSans-Medium': InstrumentSans_500Medium,
    'InstrumentSans-SemiBold': InstrumentSans_600SemiBold,
  });

  useEffect(() => bindAppStateToQueryFocus(), []);
  useEffect(() => bindNetworkToQueries(), []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <SessionProvider>
              <RootNavigator />
            </SessionProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

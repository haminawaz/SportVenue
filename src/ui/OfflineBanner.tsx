import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { WifiSlash } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, zIndex } from '@/theme/tokens';

import { AppText } from './AppText';

/**
 * Tells React Query when the device goes offline (queries pause, then
 * refetch on reconnect).
 */
export function bindNetworkToQueries() {
  return NetInfo.addEventListener((state) => {
    onlineManager.setOnline(state.isConnected !== false && state.isInternetReachable !== false);
  });
}

/** Floating pill while offline. Cached data stays on screen underneath. */
export function OfflineBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(() => !onlineManager.isOnline());

  useEffect(() => onlineManager.subscribe((online) => setOffline(!online)), []);

  if (!offline) return null;
  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + spacing.xs }]}>
      <View role="alert" style={[styles.pill, { backgroundColor: colors.text, shadowColor: colors.shadow }]}>
        <WifiSlash size={20} color={colors.background} />
        <AppText variant="body-strong" style={{ color: colors.background }}>
          You’re offline. Showing saved data.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: zIndex.toast },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});

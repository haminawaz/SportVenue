import { StyleSheet, View } from 'react-native';
import { ArrowClockwise, WarningCircle } from 'phosphor-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { Button } from './Button';
import { useSurface } from './surface';

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
};

export function ErrorState({ title, message, onRetry, retrying }: ErrorStateProps) {
  const { colors } = useTheme();
  const surface = useSurface();
  return (
    <View style={[surface, styles.box]} role="alert">
      <View style={[styles.iconWrap, { backgroundColor: colors.dangerSoft }]}>
        <WarningCircle size={30} color={colors.danger} />
      </View>
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      <AppText tone="muted" style={[styles.center, styles.message]}>
        {message}
      </AppText>
      {onRetry && <Button label="Try again" icon={ArrowClockwise} variant="secondary" onPress={onRetry} loading={retrying} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: spacing.xxxl, gap: spacing.sm, alignItems: 'center' },
  iconWrap: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  center: { textAlign: 'center' },
  message: { marginBottom: spacing.lg },
});

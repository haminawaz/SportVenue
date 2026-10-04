import { StyleSheet, View } from 'react-native';
import { CourtBasketball } from 'phosphor-react-native';

import { spacing } from '@/theme/tokens';
import { EmptyState } from '@/ui/EmptyState';
import { SectionHeader } from '@/ui/SectionHeader';

import type { CourtUtilization } from '../types/facilityDashboard.types';

import { CourtUtilizationCard } from './CourtUtilizationCard';

type CourtUtilizationSectionProps = {
  courts: CourtUtilization[];
  currency: string;
  title: string;
  onCourtPress: (courtId: string) => void;
  onSeeAll?: () => void;
};

export function CourtUtilizationSection({ courts, currency, title, onCourtPress, onSeeAll }: CourtUtilizationSectionProps) {
  return (
    <View>
      <SectionHeader title={title} onLink={onSeeAll} />
      {courts.length === 0 ? (
        <EmptyState compact icon={CourtBasketball} title="No courts to show" message="Courts appear here once they are set up for booking." />
      ) : (
        <View style={styles.list}>
          {courts.map((court) => (
            <CourtUtilizationCard key={court.id} court={court} currency={currency} onPress={onCourtPress} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm + 2 },
});

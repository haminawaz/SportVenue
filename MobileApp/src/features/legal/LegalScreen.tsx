import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { useAuth } from '@/session/SessionProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';

import { LAST_UPDATED, LEGAL_DETAILS_PENDING, LEGAL_DOCUMENTS, LEGAL_LINKS, parseInline, type LegalBlock, type LegalSlug } from './content';
import { PRIVACY_CHOICES_LABEL, useOpenPrivacyChoices } from './PrivacyChoices';

/** One legal string: plain text, bold lead-ins, links and pending details, as nested text. */
function Inline({ text, variant = 'body-md', tone = 'muted' }: { text: string; variant?: 'body-md' | 'body-sm'; tone?: 'muted' | 'default' }) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <AppText variant={variant} tone={tone}>
      {parseInline(text).map((part, i) => {
        switch (part.kind) {
          case 'strong':
            return (
              <AppText key={i} variant="body-strong">
                {part.text}
              </AppText>
            );
          case 'pending':
            return (
              <AppText key={i} variant={variant} accessibilityHint="To be confirmed before launch" style={{ color: colors.warning, backgroundColor: colors.warningSoft }}>
                {` ${part.text} (pending) `}
              </AppText>
            );
          case 'link':
            return (
              <AppText
                key={i}
                variant={variant}
                tone="accent"
                role="link"
                style={styles.link}
                onPress={() => (part.href.startsWith('/') ? router.push(part.href as Href) : void Linking.openURL(part.href))}
              >
                {part.text}
              </AppText>
            );
          default:
            return part.text;
        }
      })}
    </AppText>
  );
}

function Block({ block }: { block: LegalBlock }) {
  const { colors } = useTheme();
  const openChoices = useOpenPrivacyChoices();
  if (typeof block === 'string') return <Inline text={block} />;
  if ('list' in block) {
    return (
      <View style={styles.list}>
        {block.list.map((item) => (
          <View key={item} style={styles.listItem}>
            <AppText tone="subtle" aria-hidden>
              •
            </AppText>
            <View style={styles.flex}>
              <Inline text={item} />
            </View>
          </View>
        ))}
      </View>
    );
  }
  if ('table' in block) {
    const { head, rows } = block.table;
    return (
      <View style={styles.list}>
        {rows.map((row) => (
          <View key={row[0]} style={[styles.card, { borderColor: colors.border }]}>
            {row.map((cell, i) => (
              <View key={i} style={styles.cell}>
                <AppText variant="caption-uppercase" tone="subtle">
                  {head[i]}
                </AppText>
                <Inline text={cell} variant="body-sm" tone={i === 0 ? 'default' : 'muted'} />
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.action}>
      <Button label={PRIVACY_CHOICES_LABEL} variant="secondary" onPress={openChoices} />
    </View>
  );
}

/**
 * A legal document screen (privacy, terms, cookies), reachable signed in or
 * out. The text is shared word for word with the web app (content.ts).
 */
export function LegalScreen({ slug }: { slug: LegalSlug }) {
  const router = useRouter();
  const { status } = useAuth();
  const { colors } = useTheme();
  const doc = LEGAL_DOCUMENTS[slug];
  const back = () => (router.canGoBack() ? router.back() : router.replace(status === 'signedIn' ? '/' : '/welcome'));

  return (
    <Screen title={doc.title} onBack={back}>
      <View style={styles.page}>
        <View style={styles.tabs} role="tablist" aria-label="Legal documents">
          {LEGAL_LINKS.map((l) => {
            const current = l.slug === slug;
            return (
              <Pressable
                key={l.slug}
                role="tab"
                aria-selected={current}
                onPress={() => !current && router.replace(l.href as Href)}
                style={({ pressed }) => [styles.tab, { borderColor: current ? colors.text : colors.borderStrong, backgroundColor: current ? colors.text : 'transparent' }, pressed && styles.pressed]}
              >
                <AppText variant="body-sm" style={{ color: current ? colors.background : colors.textMuted }}>
                  {l.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="body-sm" tone="muted">
          Last updated {LAST_UPDATED}
        </AppText>

        {LEGAL_DETAILS_PENDING && (
          <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
            <AppText variant="body-strong">Draft</AppText>
            <AppText variant="body-sm">
              Some details, such as who operates SportVenue and how to contact us, are still being confirmed. They are marked as pending below and will be added before launch.
            </AppText>
          </View>
        )}

        {doc.sections.map((s) => (
          <View key={s.id} style={styles.section}>
            <AppText variant="title-md" role="heading">
              {s.heading}
            </AppText>
            {s.blocks.map((b, i) => (
              <Block key={i} block={b} />
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: spacing.xxl, paddingBottom: spacing.huge + spacing.xxl },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tab: { minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.md + 2, borderRadius: radius.full, borderWidth: 1 },
  pressed: { opacity: 0.7 },
  notice: { gap: spacing.xs, padding: spacing.lg, borderRadius: radius.card - 8 },
  section: { gap: spacing.md },
  list: { gap: spacing.sm },
  listItem: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  card: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.card - 8, borderWidth: StyleSheet.hairlineWidth },
  cell: { gap: spacing.xxs },
  link: { textDecorationLine: 'underline' },
  action: { alignItems: 'flex-start' },
});

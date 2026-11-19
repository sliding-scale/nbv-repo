import { ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/brand-mark';
import { FeatureRow } from '@/components/onboarding/feature-row';
import { OnboardingHero } from '@/components/onboarding/onboarding-hero';
import { PrimaryButton } from '@/components/primary-button';
import { LOGIN_ROUTE } from '@/constants/routes';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FEATURES = [
  {
    icon: 'navigate',
    title: 'Live van location',
    description: "See exactly where your child's school van is, in real time.",
  },
  {
    icon: 'notifications',
    title: 'Pickup & drop-off updates',
    description: 'Know when the van is on its way and when your child is picked up.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Private and secure',
    description: "You only see the van your child rides, shared by your child's school.",
  },
] as const;

/** First screen at startup. "Get started" takes the parent to sign in. */
export default function OnboardingScreen() {
  const colors = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        <BrandMark />

        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <OnboardingHero />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(500)}>
          <Text style={[styles.title, { color: colors.text }]}>
            Know where your child&apos;s van is, every trip.
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Follow the school van live and get updates from pickup to drop-off.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(500)} style={styles.features}>
          {FEATURES.map((f) => (
            <FeatureRow key={f.title} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(360).duration(500)}
        style={[styles.footer, { borderTopColor: colors.border }]}
      >
        <PrimaryButton label="Get started" icon="arrow-forward" onPress={() => router.push(LOGIN_ROUTE)} />
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Use the email address your child&apos;s school has on record.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  hero: { alignItems: 'center', marginVertical: spacing.xl },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 16, lineHeight: 23, marginTop: spacing.sm },
  features: { marginTop: spacing.xl, gap: spacing.lg },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  note: { fontSize: 12, textAlign: 'center' },
});

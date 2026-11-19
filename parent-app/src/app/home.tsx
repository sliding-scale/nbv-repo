import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { BrandMark } from '@/components/brand-mark';
import { ParentError } from '@/components/parent-error';
import { SettingsSheet } from '@/components/settings/settings-sheet';
import { floatingShadow, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { firstName, formatFee, greeting, monthName, schoolYearMonth } from '@/lib/school';
import type { VanState } from '@/lib/tracking';

function rideCopy(state: VanState['state'] | undefined) {
  switch (state) {
    case 'live':
      return { title: 'On the way', detail: 'Driver is on the route', live: true };
    case 'outside_hours':
      return { title: 'Not on the road', detail: 'Tracking opens at pickup and drop-off', live: false };
    case 'tracking_off':
      return { title: 'Tracking is off', detail: 'The school has hidden live tracking', live: false };
    case 'no_location':
      return { title: 'Waiting for the van', detail: 'Location appears when the tracker reports', live: false };
    case 'out_of_service':
      return { title: 'Van not in service', detail: 'This van is out of service right now', live: false };
    case 'no_van':
      return { title: 'No van yet', detail: 'A van has not been assigned', live: false };
    case 'no_child':
      return { title: 'No child linked', detail: 'The school has not linked a child yet', live: false };
    default:
      return { title: 'Checking the ride', detail: 'Looking up the van', live: false };
  }
}

/** Signed-in home. Cards open the map, driver, and fee screens. There is no tab bar. */
export default function HomeScreen() {
  const colors = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const me = useQuery(api.parent.account.me);
  const driver = useQuery(api.parent.driver.details);
  const fees = useQuery(api.parent.fees.mine);
  const tracking = useQuery(api.parent.tracking.myVan);

  const name = me ? firstName(me.fullName) : '';
  const { year, month } = schoolYearMonth();
  const monthLabel = monthName(month);
  const current = fees?.charges.find((charge) => charge.year === year && charge.month === month);
  const paid = current?.status === 'paid';
  const ride = rideCopy(tracking?.van.state);
  const driverName = driver?.van?.driverName?.trim() || 'Not added yet';

  const feeTitle = !fees
    ? 'Checking this month'
    : !fees.childName
      ? 'No child linked'
      : !current
        ? 'No fee this month'
        : paid
          ? 'Payment received'
          : 'Payment is due';
  const feeDetail = !fees
    ? 'Loading the van fee'
    : !fees.childName
      ? 'Ask the school to link your child'
      : !current
        ? 'Nothing to pay yet'
        : paid
          ? `${formatFee(current.amount)} paid`
          : `${formatFee(current.amount)} outstanding`;
  const feeAction = current && 'View fees';
  const feeAmount = current ? formatFee(current.amount) : '—';
  const feeStatus = !fees ? 'Checking' : !current ? 'No fee yet' : paid ? 'paid' : 'unpaid';
  const feeTone = paid ? colors.success : current ? colors.danger : colors.textMuted;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surface }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <BrandMark />

        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <View style={styles.kickerRow}>
              <View style={[styles.kickerDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.kicker, { color: colors.success }]}>{greeting().toUpperCase()}</Text>
            </View>
            <Text style={[styles.name, { color: colors.text }]}>Hi, {name || 'there'}</Text>
            <Text style={[styles.lead, { color: colors.textMuted }]}>Everything for your child&apos;s school ride.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => setSettingsOpen(true)}
            style={[styles.settings, { backgroundColor: colors.background }]}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${feeTitle}. ${feeDetail}`}
            onPress={() => router.push('/fees')}
            style={({ pressed }) => [styles.feeCard, { backgroundColor: colors.primary, opacity: pressed ? 0.94 : 1 }]}
          >
            <View style={styles.glow} />
            <View style={styles.feeIcon}>
              <Ionicons name="school" size={22} color={colors.onPrimary} />
            </View>
            <View style={styles.feeCopy}>
              <Text style={styles.feeKicker}>VAN FEE · {monthLabel.toUpperCase()}</Text>
              <Text style={styles.feeTitle}>{feeTitle}</Text>
              <Text style={styles.feeDetail}>{feeDetail}</Text>
            </View>
            <View style={[styles.payButton, { backgroundColor: colors.onPrimary }]}>
              <Text style={[styles.payLabel, { color: colors.primary }]}>{feeAction}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>YOUR DAILY RIDE</Text>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{ride.title}</Text>
            {ride.live ? (
              <View style={[styles.liveBadge, { backgroundColor: colors.successSoft }]}>
                <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.liveLabel, { color: colors.success }]}>LIVE</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Track your van. ${ride.detail}`}
            onPress={() => router.push('/track')}
            style={({ pressed }) => [styles.rideCard, { backgroundColor: colors.primary, opacity: pressed ? 0.94 : 1 }]}
          >
            <View style={styles.rideGlow} />
            <View style={styles.rideTop}>
              <View style={styles.route}>
                <View style={styles.routeIcon}>
                  <Ionicons name="bus" size={18} color={colors.onPrimary} />
                </View>
                <View style={styles.dots}>
                  {Array.from({ length: 7 }, (_, index) => (
                    <View key={index} style={styles.dot} />
                  ))}
                </View>
                <Ionicons name="location" size={18} color={colors.onPrimary} />
              </View>
              <View style={styles.linkRow}>
                <Text style={styles.link}>Live map</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.onPrimary} />
              </View>
            </View>
            <View style={styles.rideBottom}>
              <View style={styles.rideCopy}>
                <Text style={styles.rideTitle}>Track your van</Text>
                <Text style={styles.rideDetail}>{ride.detail}</Text>
              </View>
              <View style={styles.linkRow}>
                <Text style={styles.link}>View trip</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.onPrimary} />
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Your driver, ${driverName}`}
              onPress={() => router.push('/driver')}
              style={({ pressed }) => [styles.infoCard, floatingShadow, { backgroundColor: colors.background, opacity: pressed ? 0.94 : 1 }]}
            >
              <View style={[styles.infoIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>YOUR DRIVER</Text>
              <Text style={[styles.infoTitle, { color: colors.text }]} numberOfLines={1}>
                {driverName}
              </Text>
              <View style={styles.infoLink}>
                <Text style={[styles.infoLinkText, { color: colors.textMuted }]}>Contact driver</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </View>
            </Pressable>
          </View>
          <View style={styles.gridItem}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Fee status, ${feeAmount}, ${monthLabel} ${feeStatus}`}
              onPress={() => router.push('/fees')}
              style={({ pressed }) => [styles.infoCard, floatingShadow, { backgroundColor: colors.background, opacity: pressed ? 0.94 : 1 }]}
            >
              <View style={[styles.infoIcon, { backgroundColor: current && !paid ? colors.dangerSoft : colors.primarySoft }]}>
                <Ionicons name="card" size={18} color={current && !paid ? colors.danger : colors.primary} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>FEE OVERVIEW</Text>
              <Text style={[styles.infoTitle, { color: feeTone }]} numberOfLines={1}>
                {feeAmount}
              </Text>
              <View style={styles.infoLink}>
                <View style={[styles.statusDot, { backgroundColor: feeTone }]} />
                <Text style={[styles.infoLinkText, { color: colors.textMuted }]}>
                  {monthLabel} · {feeStatus}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>Your child&apos;s ride, in safe hands</Text>
          <Ionicons name="checkmark" size={14} color={colors.success} />
        </View>
      </ScrollView>
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </SafeAreaView>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <ParentError retry={retry} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  greetingText: { flex: 1 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  kickerDot: { width: 7, height: 7, borderRadius: 4 },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1 },
  name: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.7, marginTop: spacing.sm },
  lead: { fontSize: 15, lineHeight: 21, marginTop: spacing.xs },
  settings: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    ...floatingShadow,
  },
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 22,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
    right: -36,
    top: -48,
  },
  feeIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  feeCopy: { flex: 1, gap: 2 },
  feeKicker: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  feeTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  feeDetail: { color: 'rgba(255,255,255,0.82)', fontSize: 13 },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  payLabel: { fontSize: 13, fontWeight: '700' },
  section: { gap: spacing.sm },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionTitle: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.4 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  rideCard: { borderRadius: 22, padding: spacing.lg, gap: spacing.xl, overflow: 'hidden', marginTop: spacing.xs },
  rideGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.1)',
    right: -40,
    top: -30,
  },
  rideTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  route: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  routeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)' },
  rideBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  rideCopy: { flex: 1, gap: 2 },
  rideTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  rideDetail: { color: 'rgba(255,255,255,0.82)', fontSize: 14 },
  link: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  grid: { flexDirection: 'row', gap: spacing.md },
  gridItem: { flex: 1 },
  infoCard: { borderRadius: 22, padding: spacing.lg, gap: 6, minHeight: 156 },
  infoIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  infoLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7 },
  infoTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  infoLink: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  infoLinkText: { fontSize: 13 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: spacing.sm },
  footerText: { fontSize: 13 },
});

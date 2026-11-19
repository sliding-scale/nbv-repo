import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { ParentError } from '@/components/parent-error';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenLoader } from '@/components/screen-loader';
import { floatingShadow, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { formatFee, formatPaidOn, monthName, schoolYearMonth } from '@/lib/school';

type Charge = {
  year: number;
  month: number;
  amount: number;
  status: 'pending' | 'paid';
  paidAt: number | null;
  paymentMethod: 'cash' | 'online_transfer' | null;
};

function shortMonth(month: number) {
  return monthName(month).slice(0, 3);
}

/** This month's fee, then earlier months, for the parent's child. */
export default function FeesScreen() {
  const colors = useTheme();
  const fees = useQuery(api.parent.fees.mine);
  const now = schoolYearMonth();
  const current = fees?.charges.find((charge) => charge.year === now.year && charge.month === now.month);
  const earlier = fees?.charges.filter((charge) => !(charge.year === now.year && charge.month === now.month)) ?? [];
  const paid = current?.status === 'paid';
  const count = fees?.charges.length ?? 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surface }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Fees Overview" subtitle={fees?.childName ? `${fees.childName} · School transport` : 'School transport'} />
      {fees === undefined ? (
        <ScreenLoader label="Loading fees…" />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {!fees.childName ? (
            <View style={[styles.panel, floatingShadow, { backgroundColor: colors.background }]}>
              <Text style={[styles.message, { color: colors.text }]}>No child linked yet</Text>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Your child&apos;s school hasn&apos;t linked your child to your account yet.
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.hero, { backgroundColor: paid ? colors.success : colors.primary }]}>
                <View style={styles.heroTop}>
                  <View style={styles.heroIcon}>
                    <Ionicons name={paid ? 'checkmark-circle' : 'time'} size={22} color={colors.onPrimary} />
                  </View>
                  <View style={[styles.badge, { backgroundColor: paid ? 'rgba(255,255,255,0.22)' : 'rgba(251,191,36,0.28)' }]}>
                    <View style={[styles.badgeDot, { backgroundColor: paid ? colors.onPrimary : '#fbbf24' }]} />
                    <Text style={[styles.badgeText, { color: paid ? colors.onPrimary : '#fde68a' }]}>
                      {!current ? 'NO FEE YET' : paid ? 'PAID' : 'PAYMENT DUE'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.heroKicker}>
                  {monthName(now.month).toUpperCase()} {now.year} · SCHOOL VAN
                </Text>
                <Text style={styles.heroAmount}>{current ? formatFee(current.amount) : 'No fee yet'}</Text>
                <Text style={styles.heroNote}>
                  {!current
                    ? 'No transport fee has been added for this month.'
                    : paid
                      ? 'Your monthly transport fee is paid.'
                      : 'Your monthly transport fee is unpaid.'}
                </Text>
                <View style={styles.heroRule} />
                <View style={styles.dueRow}>
                  <Text style={styles.dueLabel}>{paid && current?.paidAt ? 'Paid on' : 'Due date'}</Text>
                  <View style={styles.dueValue}>
                    <Ionicons name="calendar-outline" size={15} color={colors.onPrimary} />
                    <Text style={styles.dueText}>
                      {paid && current?.paidAt ? formatPaidOn(current.paidAt) : `${shortMonth(now.month)} ${now.year}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.heroRule} />
                <View style={styles.updated}>
                  <Ionicons name="shield-checkmark-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.updatedText}>Fee status is updated by your Van Provider.</Text>
                </View>
              </View>

              <View style={[styles.panel, floatingShadow, { backgroundColor: colors.background }]}>
                <View style={styles.panelHead}>
                  <View style={styles.panelTitles}>
                    <Text style={[styles.overview, { color: colors.textMuted }]}>FEES OVERVIEW</Text>
                    <Text style={[styles.ledgerTitle, { color: colors.text }]}>Fee ledger</Text>
                  </View>
                  <View style={[styles.count, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.countText, { color: colors.textMuted }]}>
                      {count} {count === 1 ? 'fee' : 'fees'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.panelHint, { color: colors.textMuted }]}>
                  Monthly school transport fees and their current status.
                </Text>

                {current ? <ChargeRow charge={current} /> : null}
                {earlier.map((charge) => (
                  <ChargeRow key={`${charge.year}-${charge.month}`} charge={charge} />
                ))}
                {earlier.length === 0 ? (
                  <View style={[styles.empty, { borderColor: colors.border }]}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.successSoft }]}>
                      <Ionicons name="checkmark" size={16} color={colors.success} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                      {current ? 'No earlier fees yet' : 'No fees yet'}
                    </Text>
                    <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Past months will appear here.</Text>
                  </View>
                ) : null}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ChargeRow({ charge }: { charge: Charge }) {
  const colors = useTheme();
  const paid = charge.status === 'paid';
  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>
        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowMonth, { color: colors.text }]}>
          {monthName(charge.month)} {charge.year}
        </Text>
        <Text style={[styles.rowKind, { color: colors.textMuted }]}>School van fee</Text>
      </View>
      <View style={styles.rowEnd}>
        <Text style={[styles.rowAmount, { color: colors.text }]}>{formatFee(charge.amount)}</Text>
        <View style={[styles.statusPill, { backgroundColor: paid ? colors.successSoft : colors.dangerSoft }]}>
          <Text style={[styles.statusText, { color: paid ? colors.success : colors.danger }]}>{paid ? 'Paid' : 'Unpaid'}</Text>
        </View>
      </View>
    </View>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <ParentError retry={retry} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { borderRadius: 24, padding: spacing.lg, gap: spacing.sm, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroKicker: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', letterSpacing: 0.7, marginTop: spacing.sm },
  heroAmount: { color: '#ffffff', fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.8 },
  heroNote: { color: 'rgba(255,255,255,0.88)', fontSize: 14 },
  heroRule: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.28)', marginVertical: spacing.xs },
  dueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dueLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  dueValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dueText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  updated: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 2 },
  updatedText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  panel: { borderRadius: 24, padding: spacing.lg, gap: spacing.md },
  panelHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  panelTitles: { flex: 1, gap: 2 },
  overview: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  ledgerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  count: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  countText: { fontSize: 12, fontWeight: '700' },
  panelHint: { fontSize: 14, lineHeight: 20, marginTop: -4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 16, padding: spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1 },
  rowMonth: { fontSize: 15, fontWeight: '700' },
  rowKind: { fontSize: 12, marginTop: 2 },
  rowEnd: { alignItems: 'flex-end', gap: 4 },
  rowAmount: { fontSize: 14, fontWeight: '700' },
  statusPill: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  emptyIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyHint: { fontSize: 13 },
  message: { fontSize: 20, fontWeight: '700' },
  hint: { fontSize: 15, lineHeight: 22 },
});

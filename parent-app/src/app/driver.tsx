import type { ComponentProps } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

function callDriver(phone: string) {
  const number = phone.replace(/\s/g, '');
  if (number) void Linking.openURL(`tel:${number}`);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Driver and van for the parent's child. No live location. */
export default function DriverScreen() {
  const colors = useTheme();
  const details = useQuery(api.parent.driver.details);
  const driverName = details?.van?.driverName?.trim() ?? '';
  const driverPhone = details?.van?.driverPhone?.trim() ?? '';
  const childName = details?.child?.fullName ?? '';
  const grade = details?.child?.grade?.trim() ?? '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surface }]} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Driver details"
        subtitle={details?.child ? `${details.child.fullName} · School transport` : 'School transport'}
      />
      {details === undefined ? (
        <ScreenLoader label="Loading driver…" />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {!details.child ? (
            <Empty icon="people" title="No child linked yet" message="Your child's school hasn't linked your child to your account yet." />
          ) : !details.van ? (
            <Empty icon="bus" title="No van assigned yet" message="Your child doesn't have a school van assigned yet." />
          ) : (
            <>
              <View style={[styles.hero, { backgroundColor: colors.primary }]}>
                <View style={styles.glow} />
                <View style={styles.avatar}>
                  <Ionicons name="person" size={32} color={colors.onPrimary} />
                </View>
                <View style={styles.verified}>
                  <View style={[styles.verifiedDot, { backgroundColor: '#4ade80' }]} />
                  <Text style={styles.verifiedText}>VERIFIED DRIVER</Text>
                </View>
                <Text style={styles.heroName}>{driverName || 'Driver name not added yet'}</Text>
                <Text style={styles.heroRole}>School van driver</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={driverPhone ? `Call ${driverName || 'driver'}` : 'No driver number yet'}
                  disabled={!driverPhone}
                  onPress={() => callDriver(driverPhone)}
                  style={({ pressed }) => [
                    styles.callButton,
                    { backgroundColor: colors.onPrimary, opacity: !driverPhone ? 0.55 : pressed ? 0.9 : 1 },
                  ]}
                >
                  <Ionicons name="call" size={16} color={colors.primary} />
                  <Text style={[styles.callLabel, { color: colors.primary }]}>Call driver</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </Pressable>
              </View>

              <Pressable
                accessibilityRole="link"
                accessibilityLabel={driverPhone ? `Call ${driverPhone}` : 'No contact number yet'}
                disabled={!driverPhone}
                onPress={() => callDriver(driverPhone)}
                style={({ pressed }) => [
                  styles.phoneCard,
                  floatingShadow,
                  { backgroundColor: colors.background, opacity: pressed && driverPhone ? 0.94 : 1 },
                ]}
              >
                <View style={[styles.phoneIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.phoneCopy}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>CONTACT NUMBER</Text>
                  <Text style={[styles.phoneNumber, { color: driverPhone ? colors.primary : colors.textMuted }]}>
                    {driverPhone || 'Not added yet'}
                  </Text>
                </View>
                <View style={[styles.phoneIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="call" size={16} color={colors.primary} />
                </View>
              </Pressable>

              <View style={styles.section}>
                <View style={styles.sectionLabel}>
                  <Ionicons name="bus" size={16} color={colors.primary} />
                  <Text style={[styles.sectionKicker, { color: colors.primary }]}>YOUR RIDE</Text>
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Van details</Text>
                <View style={[styles.detailCard, floatingShadow, { backgroundColor: colors.background }]}>
                  <Field label="Driver name" value={driverName || 'Not added yet'} />
                  <View style={[styles.rule, { backgroundColor: colors.border }]} />
                  <Field label="Registration number" value={details.van.registrationNumber} />
                  <View style={[styles.rule, { backgroundColor: colors.border }]} />
                  <Field label="Vehicle model" value={details.van.model.trim() || 'Not added yet'} />
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionLabel}>
                  <Ionicons name="school" size={16} color={colors.success} />
                  <Text style={[styles.sectionKicker, { color: colors.success }]}>PASSENGER</Text>
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Student details</Text>
                <View style={[styles.studentCard, floatingShadow, { backgroundColor: colors.background }]}>
                  <View style={[styles.initials, { backgroundColor: colors.successSoft }]}>
                    <Text style={[styles.initialsText, { color: colors.success }]}>{initials(childName)}</Text>
                  </View>
                  <View style={styles.studentCopy}>
                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>CHILD</Text>
                    <Text style={[styles.studentName, { color: colors.text }]}>{childName}</Text>
                  </View>
                  {grade ? (
                    <View style={[styles.grade, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.gradeText, { color: colors.textMuted }]}>{grade.toUpperCase()}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.footer}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.footerText, { color: colors.textMuted }]}>Driver and vehicle details are verified</Text>
                <Ionicons name="checkmark" size={14} color={colors.success} />
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const colors = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.fieldValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function Empty({ icon, title, message }: { icon: ComponentProps<typeof Ionicons>['name']; title: string; message: string }) {
  const colors = useTheme();
  return (
    <View style={[styles.empty, floatingShadow, { backgroundColor: colors.background }]}>
      <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>{message}</Text>
    </View>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <ParentError retry={retry} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { borderRadius: 24, alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.sm, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.12)',
    right: -40,
    top: -50,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(22,163,74,0.28)',
    marginTop: spacing.xs,
  },
  verifiedDot: { width: 6, height: 6, borderRadius: 3 },
  verifiedText: { color: '#bbf7d0', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroName: { color: '#ffffff', fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  heroRole: { color: 'rgba(255,255,255,0.85)', fontSize: 15 },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: spacing.sm,
  },
  callLabel: { fontSize: 15, fontWeight: '700' },
  phoneCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 20, padding: spacing.md },
  phoneIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  phoneCopy: { flex: 1, gap: 2 },
  phoneNumber: { fontSize: 16, fontWeight: '700' },
  section: { gap: spacing.sm },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionKicker: { fontSize: 12, fontWeight: '800', letterSpacing: 0.7 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  detailCard: { borderRadius: 20, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  field: { paddingVertical: spacing.md, gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  fieldValue: { fontSize: 16, fontWeight: '700' },
  rule: { height: StyleSheet.hairlineWidth },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 20, padding: spacing.md },
  initials: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontSize: 16, fontWeight: '800' },
  studentCopy: { flex: 1, gap: 2 },
  studentName: { fontSize: 16, fontWeight: '800' },
  grade: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  gradeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: spacing.xs },
  footerText: { fontSize: 13 },
  empty: { borderRadius: 24, padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyText: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});

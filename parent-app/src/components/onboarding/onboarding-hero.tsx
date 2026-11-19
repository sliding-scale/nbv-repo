import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function StatusChip({
  icon,
  iconColor,
  iconBackground,
  title,
  subtitle,
  colors,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  title: string;
  subtitle: string;
  colors: ThemeColors;
  style: object;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.background, borderColor: colors.border }, style]}>
      <View style={[styles.chipIcon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View>
        <Text style={[styles.chipTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.chipSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

/**
 * Illustration for the onboarding screen: the van in the middle with two sample
 * notifications of the kind parents will get. Purely decorative.
 */
export function OnboardingHero() {
  const colors = useTheme();
  return (
    <View
      style={styles.container}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.ringOuter, { backgroundColor: colors.primarySoft, opacity: 0.45 }]} />
      <View style={[styles.ringInner, { backgroundColor: colors.primarySoft }]} />
      <View style={[styles.van, { backgroundColor: colors.primary }]}>
        <Ionicons name="bus" size={56} color={colors.onPrimary} />
      </View>

      <StatusChip
        colors={colors}
        style={styles.chipTop}
        icon="location"
        iconColor={colors.primary}
        iconBackground={colors.primarySoft}
        title="Van is 5 min away"
        subtitle="Arriving at your stop"
      />
      <StatusChip
        colors={colors}
        style={styles.chipBottom}
        icon="checkmark-circle"
        iconColor={colors.success}
        iconBackground={colors.successSoft}
        title="Picked up"
        subtitle="7:42 AM · Model Town"
      />
    </View>
  );
}

const SIZE = 260;

const styles = StyleSheet.create({
  container: { width: SIZE + 40, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ringOuter: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
  ringInner: { position: 'absolute', width: SIZE * 0.68, height: SIZE * 0.68, borderRadius: SIZE },
  van: {
    width: 112,
    height: 112,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e3a8a',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  chipTop: { top: 18, right: 0 },
  chipBottom: { bottom: 18, left: 0 },
  chipIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  chipTitle: { fontSize: 13, fontWeight: '600' },
  chipSubtitle: { fontSize: 11, marginTop: 1 },
});

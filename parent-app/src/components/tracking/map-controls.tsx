import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { floatingShadow, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Top-left pill: when the van's tracker last reported. The dot is green while the report is
 * recent and grey once it's old, so the parent can tell the van may have moved since.
 */
export function LastReportPill({ time, stale }: { time: string; stale: boolean }) {
  const colors = useTheme();
  return (
    <View
      style={[styles.pill, floatingShadow, { backgroundColor: colors.floating }]}
      accessibilityRole="text"
      accessibilityLabel={`Last Reporting time ${time}${stale ? ', not recent' : ''}`}
    >
      <View style={[styles.dot, { backgroundColor: stale ? colors.stale : colors.success }]} />
      <Text style={[styles.pillLabel, { color: colors.textMuted }]}>Last Reporting time</Text>
      <Text style={[styles.pillTime, { color: colors.text }]}>{time}</Text>
    </View>
  );
}

/** Round floating button over the map (settings, re-centre). */
export function MapIconButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        floatingShadow,
        { backgroundColor: pressed ? colors.surface : colors.floating },
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
    </Pressable>
  );
}

/** Card at the bottom of the map explaining why the van isn't shown (or that it's loading). */
export function StatusCard({
  icon,
  title,
  message,
  loading = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  loading?: boolean;
}) {
  const colors = useTheme();
  return (
    <View style={[styles.card, floatingShadow, { backgroundColor: colors.floating }]} accessibilityLiveRegion="polite">
      <View style={[styles.cardIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        {!loading && <Text style={[styles.cardMessage, { color: colors.textMuted }]}>{message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    flexShrink: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillLabel: { fontSize: 13, fontWeight: '500' },
  pillTime: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  cardIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardMessage: { fontSize: 14, lineHeight: 20 },
});

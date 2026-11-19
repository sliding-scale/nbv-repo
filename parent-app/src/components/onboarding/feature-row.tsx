import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

/** One "what you get" line on the onboarding screen. */
export function FeatureRow({ icon, title, description }: Props) {
  const colors = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  description: { fontSize: 13, marginTop: 2, lineHeight: 18 },
});

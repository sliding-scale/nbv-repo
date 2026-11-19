import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Shown while a screen's data is still arriving. */
export function ScreenLoader({ label }: { label: string }) {
  const colors = useTheme();
  return (
    <View style={[styles.fill, { backgroundColor: colors.surface }]}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  label: { fontSize: 14, fontWeight: '600' },
});

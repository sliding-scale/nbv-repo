import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Back control plus a title. Inner screens use this instead of a tab bar. */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const colors = useTheme();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to home"
        hitSlop={8}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
        style={[styles.back, { backgroundColor: colors.background }]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <View style={styles.titles}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  back: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, marginTop: 2 },
});

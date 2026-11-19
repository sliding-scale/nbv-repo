import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** VanTrack logo + name, shown at the top of the onboarding and sign-in screens. */
export function BrandMark() {
  const colors = useTheme();
  return (
    <View style={styles.brand} accessibilityRole="header" accessibilityLabel="VanTrack">
      <View style={[styles.logo, { backgroundColor: colors.primary }]}>
        <Ionicons name="bus" size={18} color={colors.onPrimary} />
      </View>
      <Text style={[styles.name, { color: colors.text }]}>VanTrack</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '700' },
});

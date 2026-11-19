import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Shows a spinner and ignores presses. */
  loading?: boolean;
  disabled?: boolean;
};

/** Full-width filled button used for the main action on a screen. */
export function PrimaryButton({ label, onPress, icon, loading = false, disabled = false }: Props) {
  const colors = useTheme();
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityLabel={label}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? colors.primaryPressed : colors.primary, opacity: disabled && !loading ? 0.5 : 1 },
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <Text style={[styles.label, { color: colors.onPrimary }]}>{label}</Text>
            {icon && <Ionicons name={icon} size={20} color={colors.onPrimary} />}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.md,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: { fontSize: 17, fontWeight: '600' },
});

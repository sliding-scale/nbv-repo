import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  error?: string | null;
  hint?: string;
  editable?: boolean;
};

/** Labelled email input with an icon, focus ring, hint and inline error. */
export const EmailField = forwardRef<TextInputInstance, Props>(function EmailField(
  { value, onChangeText, onSubmit, error, hint, editable = true },
  ref,
) {
  const colors = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? '#dc2626' : focused ? colors.primary : colors.border;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]} nativeID="email-label">
        Email address
      </Text>
      <View
        style={[styles.inputRow, { borderColor, backgroundColor: colors.background }]}
      >
        <Ionicons name="mail-outline" size={20} color={focused ? colors.primary : colors.textMuted} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          placeholder="name@example.com"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
          accessibilityLabelledBy="email-label"
          accessibilityHint={hint}
          keyboardType="email-address"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          enterKeyHint="send"
        />
      </View>
      {error ? (
        <View style={styles.messageRow} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={15} color="#dc2626" />
          <Text style={[styles.message, { color: '#dc2626' }]}>{error}</Text>
        </View>
      ) : (
        hint && <Text style={[styles.message, { color: colors.textMuted }]}>{hint}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { fontSize: 14, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: spacing.md },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  message: { fontSize: 13, lineHeight: 18, flexShrink: 1 },
});

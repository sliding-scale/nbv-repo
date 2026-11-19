import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  onChange: (code: string) => void;
  length: number;
  error?: boolean;
  disabled?: boolean;
};

/**
 * One-time-code input drawn as separate digit boxes. A single real TextInput sits on top
 * (with invisible text), so typing, pasting and the phone's code autofill all just work.
 */
export const CodeInput = forwardRef<TextInputInstance, Props>(function CodeInput(
  { value, onChange, length, error = false, disabled = false },
  ref,
) {
  const colors = useTheme();
  const [focused, setFocused] = useState(true);
  const digits = value.split('');
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View style={styles.row}>
      {Array.from({ length }, (_, i) => {
        const isActive = focused && !disabled && i === activeIndex;
        const filled = i < digits.length;
        const borderColor = error ? '#dc2626' : isActive ? colors.primary : filled ? colors.textMuted : colors.border;
        return (
          <View
            key={i}
            style={[
              styles.box,
              {
                borderColor,
                backgroundColor: filled ? colors.surface : colors.background,
                borderWidth: isActive ? 2 : 1.5,
              },
            ]}
          >
            <Text style={[styles.digit, { color: colors.text }]}>{digits[i] ?? ''}</Text>
          </View>
        );
      })}

      <TextInput
        ref={ref}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        maxLength={length}
        autoFocus
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        accessibilityLabel={`${length}-digit sign-in code`}
        caretHidden
        selectionColor="transparent"
        style={styles.hiddenInput}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  box: {
    flex: 1,
    maxWidth: 56,
    aspectRatio: 0.85,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { fontSize: 26, fontWeight: '700' },
  // Covers the boxes so taps focus it and autofill attaches to it; its own text is invisible.
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    color: 'transparent',
    backgroundColor: 'transparent',
    fontSize: 1,
  },
});

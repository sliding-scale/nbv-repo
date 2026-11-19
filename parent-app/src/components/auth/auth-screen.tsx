import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/brand-mark';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  children: ReactNode;
  /** Pinned to the bottom, above the keyboard (e.g. the main button). */
  footer?: ReactNode;
  /** Label for the back button. */
  backLabel?: string;
};

/**
 * Bottom space that follows the keyboard frame by frame, on the UI thread.
 *
 * React Native's KeyboardAvoidingView only reacts on Android after the keyboard has finished
 * opening (keyboardDidShow), so the layout jumped and fought the keyboard animation. Reanimated's
 * keyboard tracking works in Expo Go. It is deprecated in favour of react-native-keyboard-controller,
 * which needs a development build; switch this one hook over once the app uses one.
 */
function useKeyboardSpacer() {
  const insets = useSafeAreaInsets();
  // The app is edge-to-edge, so both system bars are drawn over: measure from the screen bottom.
  const keyboard = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true, isNavigationBarTranslucentAndroid: true });
  const bottomInset = insets.bottom;
  return useAnimatedStyle(() => ({
    // Keyboard closed: keep clear of the home indicator / navigation bar. Open: sit on the keyboard.
    paddingBottom: Math.max(keyboard.height.value, bottomInset),
  }));
}

/**
 * Shared frame for the sign-in screens: back button + logo, scrollable content, and an
 * optional footer that rides on top of the keyboard.
 */
export function AuthScreen({ children, footer, backLabel = 'Back' }: Props) {
  const colors = useTheme();
  const keyboardSpacer = useKeyboardSpacer();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <Animated.View style={[styles.safe, keyboardSpacer]}>
        <View style={styles.header}>
          {router.canGoBack() && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={backLabel}
              hitSlop={12}
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.back,
                { backgroundColor: pressed ? colors.border : colors.surface },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
          )}
          <BrandMark />
        </View>

        <ScrollView
          style={styles.safe}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {footer && <View style={styles.footer}>{footer}</View>}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  back: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.md },
});

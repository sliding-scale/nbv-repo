import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type TextInputInstance,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { CodeInput } from '@/components/auth/code-input';
import { EmailField } from '@/components/auth/email-field';
import { PrimaryButton } from '@/components/primary-button';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { EMAIL_PATTERN, normalizeEmail, OTP_LENGTH, RESEND_COOLDOWN_S } from '@/lib/sign-in';
import { convexErrorMessage } from '@/lib/tracking';

type Step = 'main' | 'email' | 'code';

type Props = { visible: boolean; onClose: () => void };

const OPEN = { duration: 320, easing: Easing.out(Easing.cubic) };
const CLOSE = { duration: 220, easing: Easing.in(Easing.cubic) };
/** Drag the sheet down this far (or flick it) to close it. */
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 900;

/**
 * Bottom sheet over the map: the parent's email (with Change) and Log out.
 * Slides up while the map dims; slides down (close button, tapping the map, back button or
 * dragging the handle down) before it's removed.
 *
 * It's a full-screen overlay in the app's own window, not a <Modal>: on Android a Modal is a
 * separate window that neither resizes for the keyboard nor reports it to Reanimated (which only
 * watches the activity window), so the keyboard covered the change-email fields. Must be rendered
 * as the last child of a full-screen screen view so it sits above everything else.
 */
export function SettingsSheet({ visible, onClose }: Props) {
  // Stays mounted after `visible` turns false only while the close animation runs: the sheet
  // itself calls onClose once it's off screen. Mounting fresh also resets it to the main page.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  if (!visible && mounted) setMounted(false);
  if (!mounted) return null;
  return <SheetContent onClosed={onClose} />;
}

function SheetContent({ onClosed }: { onClosed: () => void }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // Edge-to-edge on Android: measure the keyboard from the very bottom of the screen, like iOS.
  const keyboard = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true, isNavigationBarTranslucentAndroid: true });
  const [step, setStep] = useState<Step>('main');
  const [pendingEmail, setPendingEmail] = useState('');
  const [justChanged, setJustChanged] = useState(false);

  const progress = useSharedValue(0); // 0 = off screen, 1 = fully open
  const drag = useSharedValue(0); // how far the parent has pulled the sheet down
  const height = useSharedValue(900); // real height after layout; until then it's safely off screen
  const closing = useRef(false);

  useEffect(() => {
    progress.set(withTiming(1, OPEN));
  }, [progress]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    Keyboard.dismiss(); // so the sheet and keyboard slide down together
    progress.set(
      withTiming(0, CLOSE, (finished) => {
        if (finished) scheduleOnRN(onClosed);
      }),
    );
  };

  const pan = usePanGesture({
    activeOffsetY: 6,
    onUpdate: (e) => {
      'worklet';
      drag.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(close);
      } else {
        drag.set(withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) }));
      }
    },
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * (1 - Math.min(drag.value / height.value, 1)),
  }));
  // Bottom padding while the keyboard is closed: clears the home indicator / navigation bar.
  const bottomPadding = Math.max(insets.bottom, spacing.lg) + spacing.sm;
  const topLimit = insets.top + spacing.md;
  const sheetStyle = useAnimatedStyle(() => {
    // Keyboard open: lift the sheet so its content sits spacing.lg above the keyboard. The bottom
    // padding (now behind the keyboard) is reused as part of that gap rather than added to it.
    const lift = Math.max(0, keyboard.height.value + spacing.lg - bottomPadding);
    return {
      // Never taller than the space above the keyboard, so the header and fields stay on screen.
      maxHeight: windowHeight - topLimit - lift,
      transform: [{ translateY: (1 - progress.value) * height.value + drag.value - lift }],
    };
  });

  const title = step === 'main' ? 'Settings' : 'Change email';
  const back = step === 'main' ? null : () => setStep(step === 'code' ? 'email' : 'main');

  // Android back button: previous step, or close from the main page.
  // Re-subscribed every render so it always sees the current step.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      (back ?? close)();
      return true;
    });
    return () => sub.remove();
  });

  return (
    <GestureHandlerRootView style={[StyleSheet.absoluteFill, styles.fill]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }, backdropStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close settings"
        />
      </Animated.View>

      <Animated.View
        onLayout={(e) => {
          height.set(e.nativeEvent.layout.height);
        }}
        style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: bottomPadding }, sheetStyle]}
        accessibilityViewIsModal
      >
        <GestureDetector gesture={pan}>
          <View>
            <View style={styles.handleArea} accessibilityHint="Drag down to close">
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.header}>
              {back && <SheetIconButton icon="arrow-back" label="Back" onPress={back} />}
              <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
                {title}
              </Text>
              <SheetIconButton icon="close" label="Close settings" onPress={close} />
            </View>
          </View>
        </GestureDetector>

        {/* Scrolls only when the content doesn't fit above the keyboard (small phones). */}
        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {step === 'main' && <MainStep justChanged={justChanged} onChangeEmail={() => setStep('email')} />}
          {step === 'email' && (
            <EmailStep
              onSent={(email) => {
                setPendingEmail(email);
                setStep('code');
              }}
            />
          )}
          {step === 'code' && (
            <CodeStep
              email={pendingEmail}
              onChangeAddress={() => setStep('email')}
              onDone={() => {
                setJustChanged(true);
                setStep('main');
              }}
            />
          )}
        </ScrollView>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

function SheetIconButton({
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
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.sheetIcon,
        { borderColor: colors.border, backgroundColor: pressed ? colors.surface : colors.background },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

// ----- main page -----

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

function MainStep({ justChanged, onChangeEmail }: { justChanged: boolean; onChangeEmail: () => void }) {
  const colors = useTheme();
  const me = useQuery(api.parent.account.me);

  if (me === undefined) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.body}>
      {justChanged && (
        <View style={[styles.banner, { backgroundColor: colors.successSoft }]} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[styles.bannerText, { color: colors.text }]}>
            Email updated. Use it the next time you sign in.
          </Text>
        </View>
      )}

      <View style={[styles.card, { borderColor: colors.border }]}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{initials(me.fullName)}</Text>
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Signed in as</Text>
            <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={1}>
              {me.fullName}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Email address</Text>
            <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={1}>
              {me.email}
            </Text>
          </View>
          <Pressable
            onPress={onChangeEmail}
            accessibilityRole="button"
            accessibilityLabel="Change email address"
            style={({ pressed }) => [
              styles.smallButton,
              { borderColor: colors.border, backgroundColor: pressed ? colors.surface : colors.background },
            ]}
          >
            <Text style={[styles.smallButtonText, { color: colors.primary }]}>Change</Text>
          </Pressable>
        </View>
      </View>

      <Text style={[styles.caption, { color: colors.textMuted }]}>
        You sign in to VanTrack with this email. Sign-in codes are sent here.
      </Text>

      <LogOutButton />
    </Animated.View>
  );
}

function LogOutButton() {
  const colors = useTheme();
  const { signOut } = useAuthActions();
  const [busy, setBusy] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Log out"
      accessibilityState={{ busy }}
      disabled={busy}
      onPress={async () => {
        setBusy(true);
        try {
          await signOut();
        } finally {
          setBusy(false);
        }
      }}
      style={({ pressed }) => [
        styles.logout,
        { borderColor: colors.border, backgroundColor: pressed ? colors.dangerSoft : colors.background },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.danger} />
      ) : (
        <>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Log out</Text>
        </>
      )}
    </Pressable>
  );
}

// ----- change email: new address -----

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const colors = useTheme();
  const requestChange = useAction(api.parent.emailChange.request);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(id);
  }, []);

  const submit = async () => {
    if (busy) return;
    const value = normalizeEmail(email);
    if (!EMAIL_PATTERN.test(value)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onSent(await requestChange({ newEmail: value }));
    } catch (e) {
      setError(convexErrorMessage(e, "Couldn't send the code. Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.body}>
      <Text style={[styles.lead, { color: colors.textMuted }]}>
        We&apos;ll send a 6-digit code to the new address to make sure it&apos;s yours.
      </Text>
      <EmailField
        ref={inputRef}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (error) setError(null);
        }}
        onSubmit={submit}
        error={error}
        editable={!busy}
      />
      <PrimaryButton label="Send code" icon="arrow-forward" loading={busy} onPress={submit} />
    </Animated.View>
  );
}

// ----- change email: confirmation code -----

const FAILURE_MESSAGES = {
  no_request: 'This code has expired. Send a new one.',
  expired: 'This code has expired. Send a new one.',
  too_many_attempts: 'Too many wrong tries. Send a new code.',
} as const;

function CodeStep({
  email,
  onChangeAddress,
  onDone,
}: {
  email: string;
  onChangeAddress: () => void;
  onDone: () => void;
}) {
  const colors = useTheme();
  const confirm = useMutation(api.parent.emailChange.confirm);
  const requestChange = useAction(api.parent.emailChange.request);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_S);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const submit = async (value: string) => {
    if (busy || value.length !== OTP_LENGTH) return;
    setBusy(true);
    setError(null);
    try {
      const result = await confirm({ code: value });
      if (result.ok) {
        onDone();
        return;
      }
      setCode('');
      setError(
        result.reason === 'wrong_code'
          ? `That code isn't right. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.`
          : FAILURE_MESSAGES[result.reason],
      );
    } catch (e) {
      setCode('');
      setError(convexErrorMessage(e, "Couldn't check the code. Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (resending || secondsLeft > 0) return;
    setResending(true);
    setError(null);
    try {
      await requestChange({ newEmail: email });
      setCode('');
      setSecondsLeft(RESEND_COOLDOWN_S);
    } catch (e) {
      setError(convexErrorMessage(e, "Couldn't send a new code. Try again."));
    } finally {
      setResending(false);
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.body}>
      <Text style={[styles.lead, { color: colors.textMuted }]}>
        Enter the code we sent to <Text style={{ color: colors.text, fontWeight: '600' }}>{email}</Text>.{' '}
        <Text style={{ color: colors.primary, fontWeight: '600' }} onPress={onChangeAddress} accessibilityRole="link">
          Wrong address?
        </Text>
      </Text>

      <CodeInput
        value={code}
        onChange={(value) => {
          setCode(value);
          if (error) setError(null);
          if (value.length === OTP_LENGTH) submit(value);
        }}
        length={OTP_LENGTH}
        error={Boolean(error)}
        disabled={busy}
      />

      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={15} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      <PrimaryButton
        label="Confirm new email"
        icon="checkmark"
        loading={busy}
        disabled={code.length !== OTP_LENGTH}
        onPress={() => submit(code)}
      />

      <Pressable
        onPress={resend}
        disabled={secondsLeft > 0 || resending}
        accessibilityRole="button"
        accessibilityState={{ disabled: secondsLeft > 0 || resending }}
        style={styles.resend}
      >
        {resending ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[styles.resendText, { color: secondsLeft > 0 ? colors.textMuted : colors.primary }]}>
            {secondsLeft > 0 ? `Send a new code in 0:${String(secondsLeft).padStart(2, '0')}` : 'Send a new code'}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  content: { flexGrow: 0, flexShrink: 1 },
  // Tall touch area around the small handle so it's easy to grab.
  handleArea: { alignItems: 'center', paddingTop: spacing.xs, paddingBottom: spacing.md },
  handle: { width: 40, height: 5, borderRadius: 3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  title: { flex: 1, fontSize: 22, fontWeight: '700', letterSpacing: -0.2 },
  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: { marginVertical: spacing.xxl },
  body: { gap: spacing.lg },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  bannerText: { flex: 1, fontSize: 14, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  divider: { height: StyleSheet.hairlineWidth },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  rowIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 16, fontWeight: '600' },
  smallButton: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 19 },
  logout: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
  lead: { fontSize: 15, lineHeight: 22 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 13, lineHeight: 18, flexShrink: 1 },
  resend: { alignItems: 'center', paddingVertical: spacing.sm, minHeight: 40, justifyContent: 'center' },
  resendText: { fontSize: 14, fontWeight: '600' },
});

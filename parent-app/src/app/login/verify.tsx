import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthActions } from '@convex-dev/auth/react';
import { AuthScreen } from '@/components/auth/auth-screen';
import { CodeInput } from '@/components/auth/code-input';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  OTP_LENGTH,
  OTP_PROVIDER,
  OTP_TTL_MINUTES,
  RESEND_COOLDOWN_S,
  signInErrorCode,
} from '@/lib/sign-in';

type Notice = { tone: 'error' | 'success'; text: string } | null;

/**
 * Step 2 of sign-in: the parent enters the 6-digit code from the email. It's checked as soon
 * as all digits are in; on success the root layout switches to the signed-in screens.
 */
export default function LoginVerifyScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const colors = useTheme();
  const { signIn } = useAuthActions();
  const inputRef = useRef<TextInputInstance>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_S);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  if (!email) return <Redirect href="/login" />;

  const verify = async (value: string) => {
    if (verifying) return;
    setVerifying(true);
    setNotice(null);
    try {
      const { signingIn } = await signIn(OTP_PROVIDER, { email, code: value });
      if (!signingIn) throw new Error('Sign-in was not completed');
      router.replace('/home');
    } catch {
      setNotice({
        tone: 'error',
        text: 'That code is incorrect or has expired. Check the latest email, or ask for a new code.',
      });
      setCode('');
      setVerifying(false);
      inputRef.current?.focus();
    }
  };

  const onChangeCode = (value: string) => {
    setCode(value);
    if (notice?.tone === 'error') setNotice(null);
    if (value.length === OTP_LENGTH) verify(value);
  };

  const resend = async () => {
    if (resending || secondsLeft > 0) return;
    setResending(true);
    setNotice(null);
    try {
      await signIn(OTP_PROVIDER, { email });
      setNotice({ tone: 'success', text: 'If this email is registered, a new code is on its way.' });
      setSecondsLeft(RESEND_COOLDOWN_S);
    } catch (err) {
      const errorCode = signInErrorCode(err);
      if (errorCode === 'NOT_REGISTERED') {
        setNotice({ tone: 'success', text: 'If this email is registered, a new code is on its way.' });
        setSecondsLeft(RESEND_COOLDOWN_S);
      } else if (errorCode === 'RESEND_TOO_SOON') {
        setNotice({ tone: 'error', text: 'Please wait a minute before asking for another code.' });
        setSecondsLeft(RESEND_COOLDOWN_S);
      } else {
        setNotice({ tone: 'error', text: "We couldn't send a new code. Check your connection and try again." });
      }
    } finally {
      setResending(false);
    }
  };

  const noticeColor = notice?.tone === 'error' ? '#dc2626' : colors.success;

  return (
    <AuthScreen backLabel="Change email">
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="mail-open" size={26} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          If this email is registered, we&apos;ve sent a {OTP_LENGTH}-digit code to{' '}
          <Text style={[styles.email, { color: colors.text }]}>{email}</Text>
        </Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} style={styles.changeLink}>
          <Text style={[styles.link, { color: colors.primary }]}>Use a different email</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.codeBlock}>
        <CodeInput
          ref={inputRef}
          value={code}
          onChange={onChangeCode}
          length={OTP_LENGTH}
          error={notice?.tone === 'error'}
          disabled={verifying}
        />

        <View style={styles.status} accessibilityLiveRegion="polite">
          {verifying ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.statusText, { color: colors.textMuted }]}>Checking code…</Text>
            </View>
          ) : notice ? (
            <View style={styles.statusRow}>
              <Ionicons
                name={notice.tone === 'error' ? 'alert-circle' : 'checkmark-circle'}
                size={16}
                color={noticeColor}
              />
              <Text style={[styles.statusText, { color: noticeColor }]}>{notice.text}</Text>
            </View>
          ) : (
            <Text style={[styles.statusText, { color: colors.textMuted }]}>
              The code expires in {OTP_TTL_MINUTES} minutes and works once.
            </Text>
          )}
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(200).duration(400)}
        style={[styles.resendCard, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.resendText, { color: colors.textMuted }]}>
          Didn&apos;t get it? Check your spam folder, or
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: secondsLeft > 0 || resending }}
          disabled={secondsLeft > 0 || resending}
          onPress={resend}
          hitSlop={8}
        >
          {resending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.link, { color: secondsLeft > 0 ? colors.textMuted : colors.primary }]}>
              {secondsLeft > 0 ? `resend code in 0:${String(secondsLeft).padStart(2, '0')}` : 'resend code'}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 16, lineHeight: 23, marginTop: spacing.sm },
  email: { fontWeight: '600' },
  changeLink: { alignSelf: 'flex-start', marginTop: spacing.sm },
  link: { fontSize: 15, fontWeight: '600' },
  codeBlock: { marginTop: spacing.xxl },
  status: { minHeight: 40, marginTop: spacing.md, justifyContent: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 13, lineHeight: 18, flexShrink: 1 },
  resendCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  resendText: { fontSize: 14 },
});

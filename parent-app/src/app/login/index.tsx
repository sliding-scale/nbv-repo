import { useRef, useState } from 'react';
import { StyleSheet, Text, type TextInputInstance } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthActions } from '@convex-dev/auth/react';
import { AuthScreen } from '@/components/auth/auth-screen';
import { EmailField } from '@/components/auth/email-field';
import { PrimaryButton } from '@/components/primary-button';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { EMAIL_PATTERN, normalizeEmail, OTP_PROVIDER, signInErrorCode } from '@/lib/sign-in';

/** Step 1 of sign-in: the parent enters the email their child's school registered. */
export default function LoginEmailScreen() {
  const colors = useTheme();
  const { signIn } = useAuthActions();
  const inputRef = useRef<TextInputInstance>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const sendCode = async () => {
    if (sending) return;
    const address = normalizeEmail(email);
    if (!EMAIL_PATTERN.test(address)) {
      setError('Enter a valid email address, like name@example.com.');
      inputRef.current?.focus();
      return;
    }

    setSending(true);
    setError(null);
    const goToCode = () => router.push({ pathname: '/login/verify', params: { email: address } });
    try {
      await signIn(OTP_PROVIDER, { email: address });
      goToCode();
    } catch (err) {
      const code = signInErrorCode(err);
      // Same next step whether or not the email is registered, so the screen never reveals
      // which addresses belong to parents. A recent code is still valid, so that continues too.
      if (code === 'NOT_REGISTERED' || code === 'RESEND_TOO_SOON') goToCode();
      else setError("We couldn't send the code. Check your internet connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthScreen
      backLabel="Back to welcome"
      footer={<PrimaryButton label="Send code" icon="arrow-forward" loading={sending} onPress={sendCode} />}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={[styles.title, { color: colors.text }]}>See where your child&apos;s van is, live</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Sign in with the email address your child&apos;s school has on file. No password needed.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.form}>
        <EmailField
          ref={inputRef}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError(null);
          }}
          onSubmit={sendCode}
          editable={!sending}
          error={error}
          hint="We'll email you a 6-digit code to sign in."
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(200).duration(400)}
        style={[styles.info, { backgroundColor: colors.surface }]}
      >
        <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
        <Text style={[styles.infoText, { color: colors.textMuted }]}>
          Not getting a code? Ask your child&apos;s school to check the email address they have for you.
        </Text>
      </Animated.View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 16, lineHeight: 23, marginTop: spacing.sm },
  form: { marginTop: spacing.xxl },
  info: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
});

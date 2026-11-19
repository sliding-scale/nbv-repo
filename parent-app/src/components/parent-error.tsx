import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthActions } from '@convex-dev/auth/react';
import { BrandMark } from '@/components/brand-mark';
import { PrimaryButton } from '@/components/primary-button';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function SignOutButton() {
  const { signOut } = useAuthActions();
  const [busy, setBusy] = useState(false);
  return (
    <PrimaryButton
      label="Sign out"
      icon="log-out-outline"
      loading={busy}
      onPress={async () => {
        setBusy(true);
        try {
          await signOut();
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

/** Shown if the account was deactivated (or removed) while the parent was signed in. */
export function ParentError({ retry }: { retry: () => void }) {
  const colors = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.body}>
        <BrandMark />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Ionicons name="lock-closed" size={30} color={colors.textMuted} />
          <Text style={[styles.title, { color: colors.text }]}>No access right now</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            Your account isn&apos;t active. Please contact your child&apos;s school.
          </Text>
          <Text style={[styles.link, { color: colors.primary }]} onPress={retry}>
            Try again
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <SignOutButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, padding: spacing.xl, gap: spacing.xxl },
  card: { padding: spacing.xl, borderRadius: radius.lg, gap: spacing.sm, alignItems: 'flex-start' },
  title: { fontSize: 22, fontWeight: '700' },
  text: { fontSize: 15, lineHeight: 22 },
  link: { fontSize: 15, fontWeight: '600', marginTop: spacing.sm },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
});

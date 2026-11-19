import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useConvexAuth } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { useTheme } from '@/hooks/use-theme';
import { convex, tokenStorage } from '@/lib/convex';

// Keep the splash screen up until we know whether a saved session exists.
SplashScreen.preventAutoHideAsync();

/**
 * Signed out: onboarding → email → code. Signed in: home.
 * Screens outside the active guard can't be reached, so signing in or out moves the
 * parent to the right place automatically, and a saved session skips onboarding on launch.
 */
function RootStack() {
  const colors = useTheme();
  const { isLoading, isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <Stack
      key={isAuthenticated ? 'app' : 'auth'}
      initialRouteName={isAuthenticated ? 'home' : 'index'}
      screenOptions={{
        headerShown: false,
        // Native slide. The screen behind stays put, so the move never opens onto a blank page.
        animation: 'ios_from_right',
        gestureEnabled: true,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login/index" />
        <Stack.Screen name="login/verify" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="home" />
        <Stack.Screen name="track" />
        <Stack.Screen name="driver" />
        <Stack.Screen name="fees" />
      </Stack.Protected>
    </Stack>
  );
}

function MissingConfig() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return (
    <View style={styles.config}>
      <Text style={styles.configTitle}>Backend not configured</Text>
      <Text style={styles.configText}>
        Set EXPO_PUBLIC_CONVEX_URL in parent-app/.env.local (see .env.example) and restart Expo.
      </Text>
    </View>
  );
}

/** Gray behind every screen. On the web, a short slide-and-fade stands in for the native stack animation. */
function AppFrame({ children }: { children: ReactNode }) {
  const colors = useTheme();
  const pathname = usePathname();
  const seen = useRef(pathname);
  const progress = useSharedValue(1);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.surface).catch(() => {});
  }, [colors.surface]);

  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || seen.current === pathname) return;
    seen.current = pathname;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [pathname, progress]);

  const motion = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.6,
    transform: [{ translateX: (1 - progress.value) * 18 }],
  }));

  return (
    <View style={[styles.frame, { backgroundColor: colors.surface }]}>
      <Animated.View style={[styles.frame, Platform.OS === 'web' ? motion : undefined]}>{children}</Animated.View>
    </View>
  );
}

export default function RootLayout() {
  if (!convex) return <MissingConfig />;
  return (
    // shouldHandleCode=false: codes are typed in the app, never delivered through a link.
    <ConvexAuthProvider client={convex} storage={tokenStorage} shouldHandleCode={false}>
      <StatusBar style="auto" />
      <AppFrame>
        <RootStack />
      </AppFrame>
    </ConvexAuthProvider>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  config: { flex: 1, justifyContent: 'center', padding: 24, gap: 8, backgroundColor: '#fff' },
  configTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  configText: { fontSize: 15, lineHeight: 22, color: '#475569' },
});

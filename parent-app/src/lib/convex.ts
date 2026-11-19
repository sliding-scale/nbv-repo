import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ConvexReactClient } from 'convex/react';
import type { TokenStorage } from '@convex-dev/auth/react';

/** Convex deployment URL, from EXPO_PUBLIC_CONVEX_URL in .env.local. */
export const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL ?? '';

/** null when the URL isn't configured; the root layout shows a setup message instead. */
export const convex = CONVEX_URL ? new ConvexReactClient(CONVEX_URL, { unsavedChangesWarning: false }) : null;

/**
 * Where the sign-in tokens (short-lived JWT + refresh token) are kept between launches:
 * the iOS Keychain / Android Keystore via expo-secure-store. Secure store doesn't exist on
 * web, so the web build falls back to localStorage.
 */
export const tokenStorage: TokenStorage =
  Platform.OS === 'web'
    ? {
        getItem: (key) => globalThis.localStorage?.getItem(key) ?? null,
        setItem: (key, value) => globalThis.localStorage?.setItem(key, value),
        removeItem: (key) => globalThis.localStorage?.removeItem(key),
      }
    : {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      };

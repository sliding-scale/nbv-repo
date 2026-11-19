import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json with settings that come from environment variables (.env.local).
 * Google Maps key: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY. On Android/iOS it's baked into the native
 * build, so after changing it rebuild the development build (`npx expo run:android|ios`).
 */
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-maps',
      GOOGLE_MAPS_API_KEY
        ? { androidGoogleMapsApiKey: GOOGLE_MAPS_API_KEY, iosGoogleMapsApiKey: GOOGLE_MAPS_API_KEY }
        : {},
    ],
  ],
});

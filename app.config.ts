import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * The API the app talks to, from API_URL: Expo CLI loads .env (shared, committed) and
 * .env.local (personal, git-ignored) before reading this file. No default on purpose: a build
 * without it must fail here, not talk to the wrong API.
 */
const apiUrl = process.env.API_URL;

if (!apiUrl) {
  throw new Error(
    'API_URL is not set: add it to .env.local or check .env (see .env for an example)',
  );
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Censo',
  slug: 'censo-scad-jujuy',
  version: '0.2.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  android: {
    package: 'com.molulabs.censo',
    // The brand mark of the web (app/public/favicon.svg): CP on the accent of the "senal" theme.
    adaptiveIcon: {
      backgroundColor: '#0E7282',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  ios: {
    bundleIdentifier: 'com.molulabs.censo',
    supportsTablet: true,
  },
  plugins: [
    ['expo-build-properties', { android: { minSdkVersion: 24 } }],
    'expo-secure-store',
    // The Jujuy logo, as on the web login. Android 12+ shows it inside a circle: the image keeps
    // the logo within it.
    [
      'expo-splash-screen',
      { image: './assets/splash-icon.png', imageWidth: 220, backgroundColor: '#ffffff' },
    ],
    'react-native-quick-crypto',
    // The local database holds producers' personal data: encrypted with SQLCipher.
    ['expo-sqlite', { useSQLCipher: true }],
    // Google Play Services location: asks the GPS at high accuracy, which the field needs (with
    // no cell or WiFi around, the default engine's balanced request may not turn the GPS on).
    ['@maplibre/maplibre-react-native', { android: { locationEngine: 'google' } }],
  ],
  extra: {
    apiUrl,
    // The project on EAS (builds, signing key, version codes).
    eas: { projectId: 'b23dd739-66d9-4eaf-b925-cb26694f3158' },
  },
});

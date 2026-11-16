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
  name: 'Censo productores',
  slug: 'censo-scad-jujuy',
  version: '0.3.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  android: {
    package: 'com.molulabs.censo',
    // The brand mark: the J of the Jujuy logo (assets/logo-jujuy.png), white on the accent of "senal".
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
    // The Jujuy logo of the login. The plugin fits the image in an imageWidth dp square, centred
    // on Android 12+'s 288 dp splash icon, which only shows a ~192 dp circle: 112 dp keeps the
    // whole logo inside it (wider, Android cuts its J and its y).
    [
      'expo-splash-screen',
      { image: './assets/logo-jujuy.png', imageWidth: 112, backgroundColor: '#ffffff' },
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

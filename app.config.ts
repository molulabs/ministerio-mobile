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
  slug: 'censo-mobile',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  android: {
    package: 'com.molulabs.censo',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
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
    'react-native-quick-crypto',
  ],
  extra: {
    apiUrl,
  },
});

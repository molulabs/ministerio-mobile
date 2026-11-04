import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * The API the app talks to. In development it is the mobile port of the local nginx
 * (infra/dev/nginx/mobile.conf): 10.0.2.2 is the host as seen from the Android emulator.
 * A phone on the LAN needs the computer's IP instead: API_URL=http://192.168.x.x:8000 pnpm start
 */
const apiUrl = process.env.API_URL ?? 'http://10.0.2.2:8000';

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
  plugins: [['expo-build-properties', { android: { minSdkVersion: 24 } }]],
  extra: {
    apiUrl,
  },
});

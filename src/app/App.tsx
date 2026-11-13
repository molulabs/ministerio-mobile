import { ToastProvider } from '@molulabs/ds';
import { DesignSystemProvider, fonts, useTokens } from '@molulabs/ds/native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { texts } from '@/src/shared/constants/texts';

import { bootstrap } from './bootstrap';
import { RootStack } from './navigation/RootStack';

type Startup = { state: 'starting' } | { state: 'ready' } | { state: 'failed'; detail: string };

/**
 * The design system's tokens for every screen, and the safe area its sheets keep clear of. The
 * theme is the one of the ministry's web app (data-theme in app/index.html).
 */
function DesignSystem({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <DesignSystemProvider theme="senal" insets={insets}>
      <Toasts bottom={insets.bottom}>{children}</Toasts>
    </DesignSystemProvider>
  );
}

/** The toasts of every screen, above the gesture bar. */
function Toasts({ bottom, children }: { bottom: number; children: ReactNode }) {
  const t = useTokens();
  return <ToastProvider stackStyle={{ bottom: bottom + t.space7 }}>{children}</ToastProvider>;
}

export default function App() {
  const [startup, setStartup] = useState<Startup>({ state: 'starting' });
  // IBM Plex and the Tabler icons of the design system. If they fail, the app goes on with the
  // system font: the icons would be missing, but nothing stops working.
  const [fontsLoaded, fontsError] = useFonts(fonts);
  const fontsSettled = fontsLoaded || fontsError !== null;

  useEffect(() => {
    bootstrap()
      .then(() => setStartup({ state: 'ready' }))
      .catch((error: unknown) => setStartup({ state: 'failed', detail: String(error) }));
  }, []);

  return (
    <SafeAreaProvider>
      <DesignSystem>
        {(startup.state === 'starting' || (startup.state === 'ready' && !fontsSettled)) && (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        )}
        {startup.state === 'failed' && (
          // Nothing is deleted: the data stays on the phone until someone looks at it.
          <View style={styles.center}>
            <Text style={styles.errorTitle}>{texts.startup.failedTitle}</Text>
            <Text style={styles.errorText}>{texts.startup.failedText}</Text>
            <Text style={styles.errorDetail}>{startup.detail}</Text>
          </View>
        )}
        {startup.state === 'ready' && fontsSettled && (
          <NavigationContainer>
            <RootStack />
          </NavigationContainer>
        )}
      </DesignSystem>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#cf222e',
  },
  errorText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

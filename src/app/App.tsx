import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { texts } from '@/src/shared/constants/texts';

import { bootstrap } from './bootstrap';
import { RootStack } from './navigation/RootStack';

type Startup = { state: 'starting' } | { state: 'ready' } | { state: 'failed'; detail: string };

export default function App() {
  const [startup, setStartup] = useState<Startup>({ state: 'starting' });

  useEffect(() => {
    bootstrap()
      .then(() => setStartup({ state: 'ready' }))
      .catch((error: unknown) => setStartup({ state: 'failed', detail: String(error) }));
  }, []);

  return (
    <SafeAreaProvider>
      {startup.state === 'starting' && (
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
      {startup.state === 'ready' && (
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      )}
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

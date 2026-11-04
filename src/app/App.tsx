import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type ApiHealth, checkApiHealth } from '@/src/infrastructure/api/health';

const appName = Constants.expoConfig?.name ?? 'Censo';
const appVersion = Constants.expoConfig?.version ?? '';

const apiStatusText: Record<ApiHealth | 'checking', string> = {
  checking: 'API: comprobando…',
  ok: 'API: conectada',
  unavailable: 'API: sin conexión',
};

export default function App() {
  const [apiStatus, setApiStatus] = useState<ApiHealth | 'checking'>('checking');

  useEffect(() => {
    let cancelled = false;
    checkApiHealth().then((status) => {
      if (!cancelled) setApiStatus(status);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const retry = async () => {
    setApiStatus('checking');
    setApiStatus(await checkApiHealth());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{appName}</Text>
      <Text style={styles.version}>Versión {appVersion}</Text>
      <Text
        style={[
          styles.apiStatus,
          apiStatus === 'checking' && styles.apiStatusChecking,
          apiStatus === 'unavailable' && styles.apiStatusError,
        ]}
      >
        {apiStatusText[apiStatus]}
      </Text>
      <Pressable onPress={retry} disabled={apiStatus === 'checking'} style={styles.retry}>
        <Text style={styles.retryText}>Reintentar</Text>
      </Pressable>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
  },
  version: {
    fontSize: 14,
    color: '#666',
  },
  apiStatus: {
    marginTop: 16,
    fontSize: 16,
    color: '#1a7f37',
  },
  apiStatusChecking: {
    color: '#666',
  },
  apiStatusError: {
    color: '#cf222e',
  },
  retry: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#0969da',
  },
});

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSession } from '@/src/features/auth/session.store';

import { RootStack } from './navigation/RootStack';

export default function App() {
  const restoring = useSession((state) => state.status === 'restoring');
  const restore = useSession((state) => state.restore);

  useEffect(() => {
    restore();
  }, [restore]);

  return (
    <SafeAreaProvider>
      {restoring ? (
        <View style={styles.restoring}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      )}
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  restoring: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

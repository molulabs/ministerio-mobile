import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

const appName = Constants.expoConfig?.name ?? 'Censo';
const appVersion = Constants.expoConfig?.version ?? '';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{appName}</Text>
      <Text style={styles.version}>Versión {appVersion}</Text>
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
});

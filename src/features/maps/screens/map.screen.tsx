import { StyleSheet, Text, View } from 'react-native';

import { texts } from '@/src/shared/constants/texts';

/** Placeholder until the offline map exists. */
export function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{texts.map.empty}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },
});

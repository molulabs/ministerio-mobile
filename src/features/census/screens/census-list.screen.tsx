import { StyleSheet, Text, View } from 'react-native';

import { texts } from '@/src/shared/constants/texts';

/** Placeholder until the drafts and the outbox exist. */
export function CensusListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{texts.census.empty}</Text>
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

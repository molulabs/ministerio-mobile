import { StyleSheet, Text, View } from 'react-native';

import { texts } from '@/src/shared/constants/texts';

type Props = {
  firstname: string;
};

/**
 * Landing tab after signing in. Generic on purpose: the app will be forked for other apps, so
 * nothing here knows about censuses.
 */
export function HomeScreen({ firstname }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{texts.home.welcome(firstname)}</Text>
      <Text style={styles.text}>{texts.home.empty}</Text>
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
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#222',
  },
  text: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },
});

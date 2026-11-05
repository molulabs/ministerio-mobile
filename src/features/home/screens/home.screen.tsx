import { StyleSheet, Text, View } from 'react-native';

import { texts } from '@/src/shared/constants/texts';

type Props = {
  firstname: string;
  /** The data needed to work without signal was never downloaded on this phone. */
  offlineDataMissing: boolean;
};

/**
 * Landing tab after signing in. Generic on purpose: the app will be forked for other apps, so
 * nothing here knows about censuses.
 */
export function HomeScreen({ firstname, offlineDataMissing }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{texts.home.welcome(firstname)}</Text>
      <Text style={styles.text}>{texts.home.empty}</Text>
      {offlineDataMissing && (
        <Text style={styles.notice} accessibilityRole="alert">
          {texts.home.offlineDataMissing}
        </Text>
      )}
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
  notice: {
    marginTop: 16,
    fontSize: 14,
    color: '#9a6700',
    backgroundColor: '#fff8c5',
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
  },
});

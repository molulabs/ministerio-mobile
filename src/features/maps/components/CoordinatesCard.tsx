import { setStringAsync } from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { texts } from '@/src/shared/constants/texts';

import { coordinatesText, formatAccuracy, formatDegrees } from '../coordinates';

/** How long "Copiado" stays on the button. */
const COPIED_MS = 2000;

type Props = {
  title: string;
  lngLat: [number, number];
  /** Metres, only for a position of the GPS. */
  accuracy?: number;
  onClose: () => void;
};

/** The coordinates of a point of the map, to read aloud, write down or paste elsewhere. */
export function CoordinatesCard({ title, lngLat, accuracy, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [longitude, latitude] = lngLat;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    await setStringAsync(coordinatesText(lngLat));
    setCopied(true);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={texts.map.closeCoordinates}
          onPress={onClose}
          hitSlop={12}
        >
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
      <Text style={styles.value} selectable>
        {texts.map.latitude} {formatDegrees(latitude)}
      </Text>
      <Text style={styles.value} selectable>
        {texts.map.longitude} {formatDegrees(longitude)}
      </Text>
      {accuracy !== undefined && (
        <Text style={styles.accuracy}>
          {texts.map.accuracy} {formatAccuracy(accuracy)}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() => void copy()}
        style={({ pressed }) => [styles.copy, pressed && styles.copyPressed]}
      >
        <Text style={styles.copyText}>{copied ? texts.map.copied : texts.map.copy}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 76,
    bottom: 48,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 6,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  close: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 15,
    color: '#222',
    fontVariant: ['tabular-nums'],
  },
  accuracy: {
    fontSize: 13,
    color: '#555',
  },
  copy: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#0b6bd9',
  },
  copyPressed: {
    backgroundColor: '#0956b0',
  },
  copyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

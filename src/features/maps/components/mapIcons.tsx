import { StyleSheet, View } from 'react-native';

import { LOCATION_COLOR } from './LocationPuck';

/*
 * The icons of the map buttons, drawn with views: a character (+, −, ◎) carries the font's room
 * above and below, and never sits in the centre. There is no icon set in the app yet.
 */

const SIZE = 22;
const STROKE = 3;
const COLOR = '#222';

export type MapIconName = 'zoomIn' | 'zoomOut' | 'fit' | 'location';

export function MapIcon({ name }: { name: MapIconName }) {
  return (
    <View style={styles.box}>
      {name === 'zoomIn' && <View style={[styles.bar, styles.vertical]} />}
      {(name === 'zoomIn' || name === 'zoomOut') && <View style={styles.bar} />}
      {name === 'fit' &&
        (['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map((corner) => (
          <View key={corner} style={[styles.corner, styles[corner]]} />
        ))}
      {name === 'location' && (
        <View style={styles.ring}>
          <View style={styles.dot} />
        </View>
      )}
    </View>
  );
}

const CORNER = 8;

const styles = StyleSheet.create({
  box: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    width: SIZE - 2,
    height: STROKE,
    borderRadius: STROKE / 2,
    backgroundColor: COLOR,
  },
  vertical: {
    width: STROKE,
    height: SIZE - 2,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: COLOR,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: STROKE, borderLeftWidth: STROKE },
  topRight: { top: 0, right: 0, borderTopWidth: STROKE, borderRightWidth: STROKE },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: STROKE, borderLeftWidth: STROKE },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: STROKE, borderRightWidth: STROKE },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: STROKE,
    borderColor: LOCATION_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LOCATION_COLOR,
  },
});

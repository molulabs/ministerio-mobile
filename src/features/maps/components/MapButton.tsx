import { Pressable, StyleSheet } from 'react-native';

import { MapIcon, type MapIconName } from './mapIcons';

type Props = {
  label: string;
  icon: MapIconName;
  onPress: () => void;
};

/** A round button over the map: big enough to press with gloves. */
export function MapButton({ label, icon, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <MapIcon name={icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  buttonPressed: {
    backgroundColor: '#dbe8fb',
  },
});

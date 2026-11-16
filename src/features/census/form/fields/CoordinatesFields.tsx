import { Button } from '@molulabs/ds';
import { useState } from 'react';
import { Modal } from 'react-native';

import {
  currentLocation,
  requestLocationPermission,
} from '@/src/infrastructure/location/currentLocation';
import { Text } from '@/src/shared/ui/Text';
import { TextField } from '@/src/shared/ui/TextField';
import { formatDegrees } from '@/src/shared/utilities/coordinates';

import { FIELD_TEXTS as T } from './fields.constants';
import { useLocationPicker } from './locationPicker.context';

type Props = {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
  errors?: { latitude?: string; longitude?: string };
};

type Locating = 'idle' | 'locating' | 'denied' | 'none';

/** The typed coordinates as [longitude, latitude], when they are a place on Earth. */
const typedPoint = (latitude: string, longitude: string): [number, number] | null => {
  if (!latitude.trim() || !longitude.trim()) return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? [lng, lat]
    : null;
};

/** Latitude and longitude: typed, taken from the GPS (it needs no signal) or chosen on the map. */
export function CoordinatesFields({ latitude, longitude, onChange, errors = {} }: Props) {
  const [locating, setLocating] = useState<Locating>('idle');
  const renderLocationPicker = useLocationPicker();
  const [picking, setPicking] = useState(false);

  const locate = async () => {
    if (!(await requestLocationPermission())) {
      setLocating('denied');
      return;
    }
    setLocating('locating');
    const position = await currentLocation();
    if (!position) {
      setLocating('none');
      return;
    }
    setLocating('idle');
    onChange(formatDegrees(position.coords.latitude), formatDegrees(position.coords.longitude));
  };

  const notice =
    locating === 'denied' ? T.locationDenied : locating === 'none' ? T.noLocation : null;

  return (
    <>
      <TextField
        label={T.latitude}
        value={latitude}
        onChangeText={(next) => onChange(next, longitude)}
        keyboardType="numbers-and-punctuation"
        error={errors.latitude}
        mono
      />
      <TextField
        label={T.longitude}
        value={longitude}
        onChangeText={(next) => onChange(latitude, next)}
        keyboardType="numbers-and-punctuation"
        error={errors.longitude}
        mono
      />
      <Button
        tone="secondary"
        icon="ti-current-location"
        disabled={locating === 'locating'}
        onClick={() => void locate()}
        aria-label={locating === 'locating' ? T.locating : T.useLocation}
      >
        {locating === 'locating' ? T.locating : T.useLocation}
      </Button>
      {renderLocationPicker && (
        <Button
          tone="secondary"
          icon="ti-map-pin"
          onClick={() => setPicking(true)}
          aria-label={T.pickOnMap}
        >
          {T.pickOnMap}
        </Button>
      )}
      {notice && <Text variant="muted">{notice}</Text>}
      {renderLocationPicker && (
        <Modal
          visible={picking}
          animationType="slide"
          // Edge to edge: the picker keeps clear of the bars with the safe area.
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setPicking(false)}
        >
          {picking &&
            renderLocationPicker({
              initial: typedPoint(latitude, longitude),
              onConfirm: ([lng, lat]) => {
                setPicking(false);
                setLocating('idle');
                onChange(formatDegrees(lat), formatDegrees(lng));
              },
              onCancel: () => setPicking(false),
            })}
        </Modal>
      )}
    </>
  );
}

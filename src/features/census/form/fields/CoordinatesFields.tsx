import { Button } from '@molulabs/ds';
import { useState } from 'react';

import {
  currentLocation,
  requestLocationPermission,
} from '@/src/infrastructure/location/currentLocation';
import { Text } from '@/src/shared/ui/Text';
import { TextField } from '@/src/shared/ui/TextField';
import { formatDegrees } from '@/src/shared/utilities/coordinates';

import { FIELD_TEXTS as T } from './fields.constants';

type Props = {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
  errors?: { latitude?: string; longitude?: string };
};

type Locating = 'idle' | 'locating' | 'denied' | 'none';

/** Latitude and longitude, typed or taken from the GPS (it needs no signal). */
export function CoordinatesFields({ latitude, longitude, onChange, errors = {} }: Props) {
  const [locating, setLocating] = useState<Locating>('idle');

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
      {notice && <Text variant="muted">{notice}</Text>}
    </>
  );
}

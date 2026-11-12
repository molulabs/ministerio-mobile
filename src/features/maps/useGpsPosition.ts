import { type GeolocationPosition, LocationManager } from '@maplibre/maplibre-react-native';
import { useEffect, useState } from 'react';

/** Metres the phone must move before a new position comes. */
const MIN_DISPLACEMENT_M = 2;

/** The positions of the GPS while enabled; off, the GPS is released (it costs battery). */
export function useGpsPosition(enabled: boolean): GeolocationPosition | undefined {
  const [position, setPosition] = useState<GeolocationPosition>();

  useEffect(() => {
    if (!enabled) return;
    LocationManager.setMinDisplacement(MIN_DISPLACEMENT_M);
    LocationManager.addListener(setPosition);
    return () => LocationManager.removeListener(setPosition);
  }, [enabled]);

  return enabled ? position : undefined;
}

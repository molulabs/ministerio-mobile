import { type CameraRef, LocationManager } from '@maplibre/maplibre-react-native';
import { type RefObject, useState } from 'react';

import { currentLocation } from '@/src/infrastructure/location/currentLocation';
import { useGpsPosition } from '@/src/infrastructure/location/useGpsPosition';
import { texts } from '@/src/shared/constants/texts';

export const ANIMATION_MS = 250;
/** Close enough to see the paths and fences around a farm. */
export const LOCATION_ZOOM = 15;

export type LngLatBounds = [number, number, number, number];

export const contains = ([west, south, east, north]: LngLatBounds, [lng, lat]: [number, number]) =>
  lng >= west && lng <= east && lat >= south && lat <= north;

type Options = {
  camera: RefObject<CameraRef | null>;
  /** The map's area: a location outside it is not shown, the camera would end at its edge. */
  bounds: LngLatBounds | null;
  /** Whether the map is in sight: the GPS costs battery. */
  enabled: boolean;
};

/**
 * The "Mi ubicación" button of a map: the location puck from the first press on (it moves by
 * itself with the GPS), and a camera that centres on it, close enough to see the farm around it.
 * The camera does not follow it afterwards: the enumerator moves the map freely and presses again
 * to come back.
 */
export function useMyLocation({ camera, bounds, enabled }: Options) {
  const [locating, setLocating] = useState(false);
  /** Why the location is not followed, shown over the map until the next try. */
  const [notice, setNotice] = useState<string | null>(null);
  const position = useGpsPosition(locating && enabled);

  const showMyLocation = async () => {
    setNotice(null);
    if (!(await LocationManager.requestPermissions())) {
      setNotice(texts.map.locationDenied);
      return;
    }
    setLocating(true);
    setNotice(texts.map.searchingLocation);

    const found = await currentLocation();
    setNotice(null);
    if (!found) {
      setNotice(texts.map.noLocation);
      return;
    }
    const here: [number, number] = [found.coords.longitude, found.coords.latitude];
    if (bounds && !contains(bounds, here)) {
      setNotice(texts.map.outsideMap);
      return;
    }
    camera.current?.easeTo({ center: here, zoom: LOCATION_ZOOM, duration: ANIMATION_MS });
  };

  return { position, notice, setNotice, showMyLocation };
}

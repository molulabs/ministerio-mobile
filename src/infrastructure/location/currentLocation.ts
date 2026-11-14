import { type GeolocationPosition, LocationManager } from '@maplibre/maplibre-react-native';

/** A fix older than this may be from elsewhere: the phone keeps the last one it had for hours. */
const FRESH_MS = 60 * 1000;
/** Without a fix by then (indoors, a cold GPS), the user is told to try again. */
const TIMEOUT_MS = 20 * 1000;

/**
 * The location now, from the GPS (it needs no signal), or undefined if no fresh fix came in
 * time. getCurrentPosition is not enough: on Android it only returns the last known location.
 */
export function currentLocation(
  now: () => number = Date.now,
): Promise<GeolocationPosition | undefined> {
  return new Promise((resolve) => {
    const finish = (position: GeolocationPosition | undefined) => {
      clearTimeout(timer);
      // The last listener stops the GPS updates of the location manager.
      LocationManager.removeListener(listener);
      resolve(position);
    };
    const listener = (position: GeolocationPosition) => {
      if (now() - position.timestamp <= FRESH_MS) finish(position);
    };
    const timer = setTimeout(() => finish(undefined), TIMEOUT_MS);
    // Starts the GPS at high accuracy; a fresh position it already had comes at once.
    LocationManager.addListener(listener);
  });
}

/** Asks for the location permission if it was not given yet; false when the user refuses it. */
export function requestLocationPermission(): Promise<boolean> {
  return LocationManager.requestPermissions();
}

/** Metres around the Earth at the equator, as web mercator counts them. */
const EQUATOR_M = 40_075_016.686;
/** MapLibre lays the world out in 512 px at zoom 0. */
const WORLD_PX = 512;
const MAX_ZOOM = 22;

/**
 * The radius of the accuracy circle, in pixels at every zoom: the map doubles its scale with each
 * zoom level, so an exponential base 2 between zoom 0 and 22 keeps it exactly `accuracyM` metres.
 * Mercator stretches with latitude: one pixel covers fewer metres away from the equator.
 */
type ZoomInterpolation = [
  'interpolate',
  ['exponential', number],
  ['zoom'],
  number,
  number,
  number,
  number,
];

export function accuracyRadius(accuracyM: number, latitude: number): ZoomInterpolation {
  const metresPerPixel =
    (EQUATOR_M * Math.cos((latitude * Math.PI) / 180)) / (WORLD_PX * 2 ** MAX_ZOOM);
  const radius = accuracyM / metresPerPixel;
  return ['interpolate', ['exponential', 2], ['zoom'], 0, radius / 2 ** MAX_ZOOM, MAX_ZOOM, radius];
}

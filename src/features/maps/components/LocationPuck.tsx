import { type GeolocationPosition, Layer, LayerAnnotation } from '@maplibre/maplibre-react-native';

import { accuracyRadius } from '../accuracyRadius';

/** The blue of the location: the location button uses it too. */
export const LOCATION_COLOR = '#33B5E5';

/** The layers a press must hit to mean "my location". */
export const LOCATION_PUCK_LAYERS = ['location-puck-dot', 'location-puck-border'];

/**
 * Where the phone is: a blue dot, and around it a translucent circle as wide as the accuracy the
 * GPS reports, in metres. A wide circle tells the enumerator the location is not reliable there.
 */
export function LocationPuck({ position }: { position: GeolocationPosition | undefined }) {
  if (!position) return null;

  const { longitude, latitude, accuracy } = position.coords;
  return (
    <LayerAnnotation id="location-puck" lngLat={[longitude, latitude]} animated>
      <Layer
        type="circle"
        id="location-puck-accuracy"
        source="location-puck"
        paint={{
          'circle-radius': accuracyRadius(accuracy, latitude),
          'circle-color': LOCATION_COLOR,
          'circle-opacity': 0.2,
          'circle-stroke-color': LOCATION_COLOR,
          'circle-stroke-opacity': 0.5,
          'circle-stroke-width': 1,
          'circle-pitch-alignment': 'map',
        }}
      />
      <Layer
        type="circle"
        id="location-puck-border"
        source="location-puck"
        paint={{ 'circle-radius': 9, 'circle-color': '#fff', 'circle-pitch-alignment': 'map' }}
      />
      <Layer
        type="circle"
        id="location-puck-dot"
        source="location-puck"
        paint={{
          'circle-radius': 6,
          'circle-color': LOCATION_COLOR,
          'circle-pitch-alignment': 'map',
        }}
      />
    </LayerAnnotation>
  );
}

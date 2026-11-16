import { Layer, LayerAnnotation } from '@maplibre/maplibre-react-native';

/** Red: unlike the blue of the location, it is a place the enumerator chose, not where they are. */
export const PICKED_POINT_COLOR = '#e53935';

/** The point a long press chose, while its coordinates are shown. */
export function PickedPoint({ lngLat }: { lngLat: [number, number] }) {
  return (
    <LayerAnnotation id="picked-point" lngLat={lngLat}>
      <Layer
        type="circle"
        id="picked-point-dot"
        source="picked-point"
        paint={{
          'circle-radius': 7,
          'circle-color': PICKED_POINT_COLOR,
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 3,
          'circle-pitch-alignment': 'map',
        }}
      />
    </LayerAnnotation>
  );
}

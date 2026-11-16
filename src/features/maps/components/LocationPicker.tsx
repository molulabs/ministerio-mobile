import { Camera, type CameraRef, Map, type MapRef } from '@maplibre/maplibre-react-native';
import { Button } from '@molulabs/ds';
import { useInsets } from '@molulabs/ds/native';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useMapDownload } from '@/src/infrastructure/sync/mapDownload.store';
import { texts } from '@/src/shared/constants/texts';
import { formatDegrees } from '@/src/shared/utilities/coordinates';

import {
  ANIMATION_MS,
  contains,
  LOCATION_ZOOM,
  type LngLatBounds,
  useMyLocation,
} from '../useMyLocation';
import { useOfflineMap } from '../useOfflineMap';
import { LocationPuck } from './LocationPuck';
import { MapButton } from './MapButton';
import { PICKED_POINT_COLOR } from './PickedPoint';

type Props = {
  /** Where the map opens, [longitude, latitude]: the coordinates already typed, if any. */
  initial: [number, number] | null;
  onConfirm: (lngLat: [number, number]) => void;
  onCancel: () => void;
};

const middle = ([west, south, east, north]: LngLatBounds): [number, number] => [
  (west + east) / 2,
  (south + north) / 2,
];

/**
 * Chooses a place on the offline map: the point is fixed in the middle and the map moves under it,
 * which a finger aims better than a tap and never hides the place. Full screen, for a Modal.
 */
export function LocationPicker({ initial, onConfirm, onCancel }: Props) {
  const { map, error } = useOfflineMap();
  const progress = useMapDownload((state) => state.progress);
  const insets = useInsets();
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const { position, notice, showMyLocation } = useMyLocation({
    camera: cameraRef,
    bounds: map?.bounds ?? null,
    enabled: true,
  });

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>{texts.map.pickTitle}</Text>
      <Text style={styles.hint}>{texts.map.pickHint}</Text>
    </View>
  );

  if (!map) {
    const message = error
      ? texts.map.unreadable
      : progress
        ? texts.map.downloading(Math.floor((progress.received / progress.total) * 100))
        : texts.map.notDownloaded;
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{message}</Text>
        </View>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button tone="secondary" onClick={onCancel} aria-label={texts.map.pickCancel}>
            {texts.map.pickCancel}
          </Button>
        </View>
      </View>
    );
  }

  // Coordinates outside the map would leave the camera at its edge: those open on the province.
  const start = initial && (!map.bounds || contains(map.bounds, initial)) ? initial : null;
  const shown = center ?? start ?? (map.bounds ? middle(map.bounds) : null);

  const zoomBy = async (delta: number) => {
    const zoom = await mapRef.current?.getZoom();
    if (zoom !== undefined) cameraRef.current?.zoomTo(zoom + delta, { duration: ANIMATION_MS });
  };

  const showJujuy = () => {
    if (map.bounds) cameraRef.current?.fitBounds(map.bounds, { duration: ANIMATION_MS });
  };

  /** The middle of the map as it is now: the last camera event may lag behind a fling. */
  const confirm = async () => {
    const lngLat = (await mapRef.current?.getCenter()) ?? shown;
    if (lngLat) onConfirm(lngLat);
  };

  return (
    <View style={styles.container}>
      {header}
      <View style={styles.container}>
        <Map
          ref={mapRef}
          style={styles.container}
          mapStyle={map.style}
          // The licences ask for the attribution in sight, not behind a button.
          attribution={false}
          logo={false}
          compass
          compassHiddenFacingNorth={false}
          scaleBar
          onRegionIsChanging={(event) => setCenter(event.nativeEvent.center)}
          onRegionDidChange={(event) => setCenter(event.nativeEvent.center)}
        >
          <Camera
            ref={cameraRef}
            initialViewState={
              start
                ? { center: start, zoom: LOCATION_ZOOM }
                : map.bounds
                  ? { bounds: map.bounds }
                  : undefined
            }
            maxBounds={map.bounds ?? undefined}
          />
          <LocationPuck position={position} />
        </Map>

        {/* The middle of the map: what "Confirmar" takes. */}
        <View pointerEvents="none" style={styles.pinArea}>
          <View style={styles.pin} />
        </View>

        <View style={styles.controls}>
          <MapButton label={texts.map.zoomIn} icon="zoomIn" onPress={() => void zoomBy(1)} />
          <MapButton label={texts.map.zoomOut} icon="zoomOut" onPress={() => void zoomBy(-1)} />
          <MapButton label={texts.map.showJujuy} icon="fit" onPress={showJujuy} />
          <MapButton
            label={texts.map.myLocation}
            icon="location"
            onPress={() => void showMyLocation()}
          />
        </View>

        {notice && <Text style={styles.notice}>{notice}</Text>}
        <Text style={styles.attribution}>{map.attributions.join(' · ')}</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {shown && (
          <View>
            <Text style={styles.value}>
              {texts.map.latitude} {formatDegrees(shown[1])}
            </Text>
            <Text style={styles.value}>
              {texts.map.longitude} {formatDegrees(shown[0])}
            </Text>
          </View>
        )}
        <Button icon="ti-check" onClick={() => void confirm()} aria-label={texts.map.pickConfirm}>
          {texts.map.pickConfirm}
        </Button>
        <Button tone="secondary" onClick={onCancel} aria-label={texts.map.pickCancel}>
          {texts.map.pickCancel}
        </Button>
      </View>
    </View>
  );
}

const PIN_SIZE = 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 4,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  hint: {
    fontSize: 14,
    color: '#555',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },
  pinArea: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: PICKED_POINT_COLOR,
    elevation: 4,
  },
  controls: {
    position: 'absolute',
    right: 12,
    bottom: 24,
    gap: 10,
  },
  notice: {
    position: 'absolute',
    left: 12,
    right: 76,
    bottom: 24,
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    color: '#5c4a00',
    backgroundColor: '#fff6c8',
  },
  attribution: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 9,
    color: '#333',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    backgroundColor: '#fff',
  },
  value: {
    fontSize: 15,
    color: '#222',
    fontVariant: ['tabular-nums'],
  },
});

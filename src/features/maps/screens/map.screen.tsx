import {
  Camera,
  type CameraRef,
  LocationManager,
  Map,
  type MapRef,
  type PressEvent,
} from '@maplibre/maplibre-react-native';
import { useIsFocused } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMapDownload } from '@/src/infrastructure/sync/mapDownload.store';
import { texts } from '@/src/shared/constants/texts';

import { CoordinatesCard } from '../components/CoordinatesCard';
import { LOCATION_PUCK_LAYERS, LocationPuck } from '../components/LocationPuck';
import { MapIcon, type MapIconName } from '../components/mapIcons';
import { PickedPoint } from '../components/PickedPoint';
import { currentLocation } from '../currentLocation';
import { useGpsPosition } from '../useGpsPosition';
import { useOfflineMap } from '../useOfflineMap';

const ANIMATION_MS = 250;
/** Close enough to see the paths and fences around a farm. */
const LOCATION_ZOOM = 15;

type LngLatBounds = [number, number, number, number];

/** Pixels around a press that still hit the location puck: a finger is wider than the dot. */
const PUCK_HIT_PX = 24;

/** Whose coordinates the card shows: the location (live) or a point chosen with a long press. */
type Selection = { kind: 'position' } | { kind: 'point'; lngLat: [number, number] } | null;

const contains = ([west, south, east, north]: LngLatBounds, [lng, lat]: [number, number]) =>
  lng >= west && lng <= east && lat >= south && lat <= north;

/**
 * The map of Jujuy from the packages on the phone: it never asks the network for tiles. The
 * location comes from the GPS, which needs no signal either.
 */
export function MapScreen() {
  const { map, error } = useOfflineMap();
  const progress = useMapDownload((state) => state.progress);
  const focused = useIsFocused();
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  /** The location puck, shown from the first press on: it moves by itself with the GPS. */
  const [locating, setLocating] = useState(false);
  /** Why the location is not followed, shown over the map until the next try. */
  const [notice, setNotice] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  // Only while the tab is in sight: the tabs stay mounted, and the GPS costs battery.
  const position = useGpsPosition(locating && focused);

  if (!map) {
    const message = error
      ? texts.map.unreadable
      : progress
        ? texts.map.downloading(Math.floor((progress.received / progress.total) * 100))
        : texts.map.notDownloaded;
    return (
      <View style={styles.empty}>
        <Text style={styles.text}>{message}</Text>
      </View>
    );
  }

  const zoomBy = async (delta: number) => {
    const zoom = await mapRef.current?.getZoom();
    if (zoom !== undefined) cameraRef.current?.zoomTo(zoom + delta, { duration: ANIMATION_MS });
  };

  const showJujuy = () => {
    if (map.bounds) cameraRef.current?.fitBounds(map.bounds, { duration: ANIMATION_MS });
  };

  /** A press on the location puck shows its coordinates; anywhere else, it closes the card. */
  const onPress = async ({ point: [x, y] }: PressEvent) => {
    const hits = position
      ? await mapRef.current?.queryRenderedFeatures(
          [
            [x - PUCK_HIT_PX, y - PUCK_HIT_PX],
            [x + PUCK_HIT_PX, y + PUCK_HIT_PX],
          ],
          { layers: LOCATION_PUCK_LAYERS },
        )
      : [];
    setSelection(hits?.length ? { kind: 'position' } : null);
  };

  /** A long press anywhere shows the coordinates of that point, marked on the map. */
  const onLongPress = ({ lngLat }: PressEvent) => {
    setNotice(null);
    setSelection({ kind: 'point', lngLat });
  };

  /**
   * Centres on the location, close enough to see the farm around it. The camera does not follow
   * it afterwards: the enumerator moves the map freely and presses again to come back. A location
   * outside the map (another province) is not shown: the camera would end at its edge.
   */
  const showMyLocation = async () => {
    setNotice(null);
    if (!(await LocationManager.requestPermissions())) {
      setNotice(texts.map.locationDenied);
      return;
    }
    setLocating(true);
    setNotice(texts.map.searchingLocation);

    const position = await currentLocation();
    setNotice(null);
    if (!position) {
      setNotice(texts.map.noLocation);
      return;
    }
    const here: [number, number] = [position.coords.longitude, position.coords.latitude];
    if (map.bounds && !contains(map.bounds, here)) {
      setNotice(texts.map.outsideMap);
      return;
    }
    cameraRef.current?.easeTo({ center: here, zoom: LOCATION_ZOOM, duration: ANIMATION_MS });
  };

  return (
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
        onPress={(event) => void onPress(event.nativeEvent)}
        onLongPress={(event) => onLongPress(event.nativeEvent)}
      >
        <Camera
          ref={cameraRef}
          initialViewState={map.bounds ? { bounds: map.bounds } : undefined}
          maxBounds={map.bounds ?? undefined}
        />
        <LocationPuck position={position} />
        {selection?.kind === 'point' && <PickedPoint lngLat={selection.lngLat} />}
      </Map>

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

      {selection?.kind === 'point' && (
        <CoordinatesCard
          title={texts.map.pickedPoint}
          lngLat={selection.lngLat}
          onClose={() => setSelection(null)}
        />
      )}
      {selection?.kind === 'position' && position && (
        <CoordinatesCard
          title={texts.map.myPosition}
          lngLat={[position.coords.longitude, position.coords.latitude]}
          accuracy={position.coords.accuracy}
          onClose={() => setSelection(null)}
        />
      )}
      {notice && !selection && <Text style={styles.notice}>{notice}</Text>}

      <Text style={styles.attribution}>{map.attributions.join(' · ')}</Text>
    </View>
  );
}

type MapButtonProps = {
  label: string;
  icon: MapIconName;
  onPress: () => void;
};

/** A round button over the map: big enough to press with gloves. */
function MapButton({ label, icon, onPress }: MapButtonProps) {
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
  container: {
    flex: 1,
  },
  empty: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    right: 12,
    bottom: 48,
    gap: 10,
  },
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
  notice: {
    position: 'absolute',
    left: 12,
    right: 76,
    bottom: 48,
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
});

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { setStringAsync } from 'expo-clipboard';

import { MapScreen } from '@/src/features/maps/screens/map.screen';

const mockCamera = { zoomTo: jest.fn(), fitBounds: jest.fn(), easeTo: jest.fn() };
const mockRequestPermissions = jest.fn();
const mockGetCurrentPosition = jest.fn();
const at = (longitude: number, latitude: number) => ({
  coords: { longitude, latitude, accuracy: 7.6 },
});
/** What the GPS gives while the screen listens to it. */
let mockGpsPosition: ReturnType<typeof at> | undefined;
/** What a press finds under the finger. */
let mockHits: unknown[] = [];
type PressHandler = (event: { nativeEvent: unknown }) => void;
let mockMapProps: { onPress: PressHandler; onLongPress: PressHandler };

// MapLibre is native: a fake that keeps the calls the screen makes.
jest.mock('@maplibre/maplibre-react-native', () => {
  const { useImperativeHandle } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    Map: ({ ref, children, ...props }: { ref: unknown; children: unknown }) => {
      mockMapProps = props as never;
      useImperativeHandle(ref, () => ({
        getZoom: async () => 10,
        queryRenderedFeatures: async () => mockHits,
      }));
      return <View>{children as never}</View>;
    },
    Camera: ({ ref }: { ref: unknown }) => {
      useImperativeHandle(ref, () => mockCamera);
      return null;
    },
    LocationManager: {
      requestPermissions: () => mockRequestPermissions(),
    },
  };
});

// The puck is drawn by MapLibre: a fake that says whether it is shown.
jest.mock('@/src/features/maps/components/LocationPuck', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    LOCATION_COLOR: '#33B5E5',
    LOCATION_PUCK_LAYERS: [],
    LocationPuck: ({ position }: { position?: unknown }) => (position ? <Text>puck</Text> : null),
  };
});

jest.mock('@/src/features/maps/components/PickedPoint', () => {
  const { Text } = jest.requireActual('react-native');
  return { PickedPoint: () => <Text>marked point</Text> };
});

jest.mock('@/src/infrastructure/location/useGpsPosition', () => ({
  useGpsPosition: (enabled: boolean) => (enabled ? mockGpsPosition : undefined),
}));

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));

jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));

jest.mock('@/src/infrastructure/location/currentLocation', () => ({
  currentLocation: () => mockGetCurrentPosition(),
}));

jest.mock('@/src/features/maps/useOfflineMap', () => ({
  useOfflineMap: () => ({
    map: {
      style: { version: 8, sources: {}, layers: [] },
      bounds: [-67, -24, -64, -21],
      attributions: ['© OpenStreetMap'],
    },
    error: false,
  }),
}));

describe('MapScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGpsPosition = undefined;
    mockHits = [];
  });

  /** Signs the location in, with the GPS at that place. */
  async function locate(longitude: number, latitude: number) {
    mockRequestPermissions.mockResolvedValue(true);
    mockGetCurrentPosition.mockResolvedValue(at(longitude, latitude));
    mockGpsPosition = at(longitude, latitude);
    await fireEvent.press(screen.getByRole('button', { name: 'Mi ubicación' }));
    await waitFor(() => expect(mockCamera.easeTo).toHaveBeenCalled());
  }

  const press = (props: 'onPress' | 'onLongPress', nativeEvent: unknown) =>
    act(async () => mockMapProps[props]({ nativeEvent }));

  it('zooms in and out one level', async () => {
    await render(<MapScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Acercar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Alejar' }));

    expect(mockCamera.zoomTo.mock.calls.map((call) => call[0])).toEqual([11, 9]);
  });

  it('goes back to the whole province', async () => {
    await render(<MapScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Ver toda la provincia' }));

    expect(mockCamera.fitBounds).toHaveBeenCalledWith([-67, -24, -64, -21], expect.anything());
  });

  it('centres on the location once allowed', async () => {
    mockRequestPermissions.mockResolvedValue(true);
    mockGetCurrentPosition.mockResolvedValue(at(-65.3, -23.5));
    mockGpsPosition = at(-65.3, -23.5);
    await render(<MapScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Mi ubicación' }));

    await waitFor(() =>
      expect(mockCamera.easeTo).toHaveBeenCalledWith(
        expect.objectContaining({ center: [-65.3, -23.5], zoom: 15 }),
      ),
    );
    expect(screen.getByText('puck')).toBeOnTheScreen();
  });

  it('does not follow a location outside the map', async () => {
    mockRequestPermissions.mockResolvedValue(true);
    mockGetCurrentPosition.mockResolvedValue(at(-122.08, 37.42));
    await render(<MapScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Mi ubicación' }));

    expect(await screen.findByText(/fuera del mapa de Jujuy/)).toBeOnTheScreen();
    expect(mockCamera.easeTo).not.toHaveBeenCalled();
  });

  it('says so when there is no GPS fix yet', async () => {
    mockRequestPermissions.mockResolvedValue(true);
    mockGetCurrentPosition.mockResolvedValue(undefined);
    await render(<MapScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Mi ubicación' }));

    expect(await screen.findByText(/Todavía no hay señal de GPS/)).toBeOnTheScreen();
    expect(mockCamera.easeTo).not.toHaveBeenCalled();
  });

  it('explains why the location is missing when it is not allowed', async () => {
    mockRequestPermissions.mockResolvedValue(false);
    await render(<MapScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Mi ubicación' }));

    expect(await screen.findByText(/Sin permiso de ubicación/)).toBeOnTheScreen();
    expect(screen.queryByText('puck')).toBeNull();
  });

  it('shows the attribution of the data', async () => {
    await render(<MapScreen />);

    expect(screen.getByText('© OpenStreetMap')).toBeOnTheScreen();
  });

  it('shows the coordinates of a point pressed long, and marks it', async () => {
    await render(<MapScreen />);

    await press('onLongPress', { lngLat: [-65.2975, -24.1852], point: [100, 200] });

    expect(screen.getByText('Punto marcado')).toBeOnTheScreen();
    expect(screen.getByText('Latitud -24.185200')).toBeOnTheScreen();
    expect(screen.getByText('Longitud -65.297500')).toBeOnTheScreen();
    expect(screen.getByText('marked point')).toBeOnTheScreen();
    expect(screen.queryByText(/Precisión/)).toBeNull();
  });

  it('copies the coordinates as latitude, longitude', async () => {
    await render(<MapScreen />);
    await press('onLongPress', { lngLat: [-65.2975, -24.1852], point: [100, 200] });

    await fireEvent.press(screen.getByRole('button', { name: 'Copiar coordenadas' }));

    expect(setStringAsync).toHaveBeenCalledWith('-24.185200, -65.297500');
    expect(screen.getByText('Copiado')).toBeOnTheScreen();
  });

  it('shows the location with its accuracy when its puck is pressed', async () => {
    await render(<MapScreen />);
    await locate(-65.3, -23.5);
    mockHits = [{ type: 'Feature' }];

    await press('onPress', { lngLat: [-65.3, -23.5], point: [200, 400] });

    expect(screen.getByText('Tu ubicación')).toBeOnTheScreen();
    expect(screen.getByText('Latitud -23.500000')).toBeOnTheScreen();
    expect(screen.getByText('Precisión ± 8 m')).toBeOnTheScreen();
  });

  it('closes the card with a press elsewhere on the map or on its button', async () => {
    await render(<MapScreen />);
    await press('onLongPress', { lngLat: [-65.2975, -24.1852], point: [100, 200] });

    await press('onPress', { lngLat: [-65, -23], point: [10, 10] });
    expect(screen.queryByText('Punto marcado')).toBeNull();

    await press('onLongPress', { lngLat: [-65.2975, -24.1852], point: [100, 200] });
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar coordenadas' }));
    expect(screen.queryByText('Punto marcado')).toBeNull();
    expect(screen.queryByText('marked point')).toBeNull();
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { LocationPicker } from '@/src/features/maps/components/LocationPicker';

const mockCamera = { zoomTo: jest.fn(), fitBounds: jest.fn(), easeTo: jest.fn() };
let mockCenter: [number, number] = [-65.5, -22.5];
type RegionHandler = (event: { nativeEvent: { center: [number, number] } }) => void;
let mockMapProps: { onRegionIsChanging: RegionHandler; onRegionDidChange: RegionHandler };
let mockCameraProps: { initialViewState?: unknown };
let mockOfflineMap: { map: unknown; error: boolean };

// MapLibre is native: a fake that keeps what the picker gives it.
jest.mock('@maplibre/maplibre-react-native', () => {
  const { useImperativeHandle } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    Map: ({ ref, children, ...props }: { ref: unknown; children: unknown }) => {
      mockMapProps = props as never;
      useImperativeHandle(ref, () => ({
        getZoom: async () => 10,
        getCenter: async () => mockCenter,
      }));
      return <View>{children as never}</View>;
    },
    Camera: ({ ref, ...props }: { ref: unknown }) => {
      mockCameraProps = props;
      useImperativeHandle(ref, () => mockCamera);
      return null;
    },
    LocationManager: { requestPermissions: async () => false },
  };
});

jest.mock('@/src/features/maps/components/LocationPuck', () => ({
  LOCATION_COLOR: '#33B5E5',
  LocationPuck: () => null,
}));

jest.mock('@/src/infrastructure/location/useGpsPosition', () => ({
  useGpsPosition: () => undefined,
}));

jest.mock('@/src/infrastructure/location/currentLocation', () => ({
  currentLocation: async () => undefined,
}));

jest.mock('@/src/features/maps/useOfflineMap', () => ({
  useOfflineMap: () => mockOfflineMap,
}));

const JUJUY = [-67, -24, -64, -21];
const offlineMap = {
  map: {
    style: { version: 8, sources: {}, layers: [] },
    bounds: JUJUY,
    attributions: ['© OpenStreetMap'],
  },
  error: false,
};

describe('LocationPicker', () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOfflineMap = offlineMap;
    mockCenter = [-65.5, -22.5];
  });

  it('opens on the typed coordinates, close to the farm', async () => {
    await render(
      <LocationPicker initial={[-65.3, -23.5]} onConfirm={onConfirm} onCancel={onCancel} />,
    );

    expect(mockCameraProps.initialViewState).toEqual({ center: [-65.3, -23.5], zoom: 15 });
    expect(screen.getByText('Latitud -23.500000')).toBeOnTheScreen();
    expect(screen.getByText('Longitud -65.300000')).toBeOnTheScreen();
  });

  it('opens on the whole province without coordinates, or with some outside it', async () => {
    await render(<LocationPicker initial={null} onConfirm={onConfirm} onCancel={onCancel} />);
    expect(mockCameraProps.initialViewState).toEqual({ bounds: JUJUY });

    await render(
      <LocationPicker initial={[-58.4, -34.6]} onConfirm={onConfirm} onCancel={onCancel} />,
    );
    expect(mockCameraProps.initialViewState).toEqual({ bounds: JUJUY });
  });

  it('shows the middle of the map while it moves', async () => {
    await render(<LocationPicker initial={null} onConfirm={onConfirm} onCancel={onCancel} />);

    await act(async () =>
      mockMapProps.onRegionIsChanging({ nativeEvent: { center: [-65.1, -23.9] } }),
    );

    expect(screen.getByText('Latitud -23.900000')).toBeOnTheScreen();
    expect(screen.getByText('Longitud -65.100000')).toBeOnTheScreen();
  });

  it('confirms the middle of the map', async () => {
    await render(<LocationPicker initial={null} onConfirm={onConfirm} onCancel={onCancel} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar ubicación' }));

    expect(onConfirm).toHaveBeenCalledWith([-65.5, -22.5]);
  });

  it('cancels without choosing', async () => {
    await render(<LocationPicker initial={null} onConfirm={onConfirm} onCancel={onCancel} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('says the map is missing and still lets go back', async () => {
    mockOfflineMap = { map: null, error: false };
    await render(<LocationPicker initial={null} onConfirm={onConfirm} onCancel={onCancel} />);

    expect(screen.getByText(/todavía no se descargó/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Confirmar ubicación' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
  });
});

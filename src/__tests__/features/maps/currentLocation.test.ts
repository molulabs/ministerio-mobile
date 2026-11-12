import { currentLocation } from '@/src/features/maps/currentLocation';

let mockListener: ((position: unknown) => void) | null = null;
const mockRemove = jest.fn();

jest.mock('@maplibre/maplibre-react-native', () => ({
  LocationManager: {
    addListener: (listener: (position: unknown) => void) => {
      mockListener = listener;
    },
    removeListener: () => mockRemove(),
  },
}));

const NOW = 1_000_000_000;
const fix = (ageMs: number) => ({
  coords: { longitude: -65.3, latitude: -24.2 },
  timestamp: NOW - ageMs,
});

describe('currentLocation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRemove.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it('skips the old location the phone kept and waits for a fresh one', async () => {
    const result = currentLocation(() => NOW);

    mockListener?.(fix(3 * 60 * 60 * 1000));
    mockListener?.(fix(2000));

    await expect(result).resolves.toEqual(fix(2000));
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('gives up when no fresh fix comes in time, and stops listening', async () => {
    const result = currentLocation(() => NOW);

    jest.advanceTimersByTime(20 * 1000);

    await expect(result).resolves.toBeUndefined();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});

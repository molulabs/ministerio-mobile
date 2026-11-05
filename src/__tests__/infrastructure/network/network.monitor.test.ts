import type { NetworkState } from 'expo-network';

import { onStableSignal } from '@/src/infrastructure/network/network.monitor';

let mockEmit: (state: NetworkState) => void;
const mockRemove = jest.fn();

jest.mock('expo-network', () => ({
  addNetworkStateListener: (listener: (state: NetworkState) => void) => {
    mockEmit = listener;
    return { remove: mockRemove };
  },
}));

const online: NetworkState = { isConnected: true, isInternetReachable: true };
const offline: NetworkState = { isConnected: false, isInternetReachable: false };
const HOLD = 30_000;

describe('onStableSignal', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('fires once the signal came back and held for the whole time', () => {
    const listener = jest.fn();
    onStableSignal(listener, HOLD);

    mockEmit(offline);
    mockEmit(online);
    jest.advanceTimersByTime(HOLD - 1);
    expect(listener).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not fire when the signal is cut before the time', () => {
    const listener = jest.fn();
    onStableSignal(listener, HOLD);

    mockEmit(offline);
    mockEmit(online);
    jest.advanceTimersByTime(HOLD / 2);
    mockEmit(offline);
    jest.advanceTimersByTime(HOLD);

    expect(listener).not.toHaveBeenCalled();
  });

  it('fires only once for a flapping signal that finally holds', () => {
    const listener = jest.fn();
    onStableSignal(listener, HOLD);

    mockEmit(offline);
    for (let blip = 0; blip < 5; blip++) {
      mockEmit(online);
      jest.advanceTimersByTime(5_000);
      mockEmit(offline);
    }
    mockEmit(online);
    jest.advanceTimersByTime(HOLD);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores the repeated events of a connection that did not change', () => {
    const listener = jest.fn();
    onStableSignal(listener, HOLD);

    mockEmit(online);
    mockEmit(online);
    jest.advanceTimersByTime(HOLD * 3);

    expect(listener).not.toHaveBeenCalled();
  });

  it('counts a connection without internet as no signal', () => {
    const listener = jest.fn();
    onStableSignal(listener, HOLD);

    mockEmit({ isConnected: true, isInternetReachable: false });
    mockEmit(online);
    jest.advanceTimersByTime(HOLD);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stops listening and cancels a pending wait when unsubscribed', () => {
    const listener = jest.fn();
    const stop = onStableSignal(listener, HOLD);

    mockEmit(offline);
    mockEmit(online);
    stop();
    jest.advanceTimersByTime(HOLD);

    expect(listener).not.toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalled();
  });
});

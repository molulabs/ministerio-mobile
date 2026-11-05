import { addNetworkStateListener, type NetworkState } from 'expo-network';

const isReachable = (state: NetworkState) =>
  state.isConnected === true && state.isInternetReachable !== false;

/**
 * Calls the listener when the signal comes back and stays for holdMs without a cut: in the field
 * the signal comes and goes, and a sync on every blip wastes data and battery. Android repeats
 * the network event every few seconds without any change, so only the transition counts. The
 * first event only sets the starting point: start-up already runs its own sync.
 */
export function onStableSignal(listener: () => void, holdMs: number): () => void {
  let reachable: boolean | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const subscription = addNetworkStateListener((state) => {
    const now = isReachable(state);
    if (now && reachable === false) {
      timer = setTimeout(() => {
        timer = null;
        listener();
      }, holdMs);
    } else if (!now) {
      cancel();
    }
    reachable = now;
  });

  return () => {
    cancel();
    subscription.remove();
  };
}

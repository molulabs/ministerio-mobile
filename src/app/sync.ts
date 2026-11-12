import { getNetworkStateAsync, NetworkStateType } from 'expo-network';
import { AppState } from 'react-native';

import { useSession } from '@/src/features/auth/session.store';
import { apiClient, apiUrl } from '@/src/infrastructure/api/client';
import { mapFiles } from '@/src/infrastructure/maps/mapFiles';
import { onStableSignal } from '@/src/infrastructure/network/network.monitor';
import { createCatalogsPuller } from '@/src/infrastructure/sync/catalogs.puller';
import { catalogsStore } from '@/src/infrastructure/sync/catalogs.store';
import { setMapDownloadProgress } from '@/src/infrastructure/sync/mapDownload.store';
import { createMapsPuller } from '@/src/infrastructure/sync/maps.puller';
import { mapsStore } from '@/src/infrastructure/sync/maps.store';
import { createSyncEngine } from '@/src/infrastructure/sync/syncEngine';

/** Automatic triggers do not pull the catalogs again within this time. */
const SYNC_MIN_INTERVAL_MS = 15 * 60 * 1000;
/** The signal must stay this long before it counts as back. */
const STABLE_SIGNAL_MS = 30 * 1000;

type SessionState = ReturnType<typeof useSession.getState>;

/** Only an online session has tokens to talk to the API. */
const isOnlineSession = (state: SessionState) =>
  state.status === 'signedIn' && state.mode === 'online';

/**
 * Wires the sync engine to its triggers: start-up, an online sign-in, the signal coming back
 * and the app coming back to the front. Only the sign-in skips the minimum interval. Called once,
 * after the session was restored.
 */
export function startSync(): () => void {
  const engine = createSyncEngine({
    canSync: () => isOnlineSession(useSession.getState()),
    pullCatalogs: createCatalogsPuller({ http: apiClient, store: catalogsStore }),
    pullMaps: createMapsPuller({
      http: apiClient,
      store: mapsStore,
      files: mapFiles,
      apiOrigin: apiUrl,
      isUnmetered: async () => {
        const { type } = await getNetworkStateAsync();
        return type === NetworkStateType.WIFI || type === NetworkStateType.ETHERNET;
      },
      onProgress: setMapDownloadProgress,
    }),
    catalogsSyncedAt: catalogsStore.syncedAt,
    minIntervalMs: SYNC_MIN_INTERVAL_MS,
  });
  const syncNow = () => void engine.syncNow();

  const session = useSession.subscribe((state, previous) => {
    if (isOnlineSession(state) && !isOnlineSession(previous)) void engine.syncNow({ force: true });
  });
  const network = onStableSignal(syncNow, STABLE_SIGNAL_MS);
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') syncNow();
  });
  syncNow();

  return () => {
    session();
    network();
    appState.remove();
  };
}

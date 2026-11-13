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
import { createOutboxSender } from '@/src/infrastructure/sync/outbox.sender';
import { outboxStore } from '@/src/infrastructure/sync/outbox.store';
import { createSyncEngine, type SendOutcome } from '@/src/infrastructure/sync/syncEngine';

/** Automatic triggers do not pull the catalogs again within this time. */
const SYNC_MIN_INTERVAL_MS = 15 * 60 * 1000;
/** The signal must stay this long before it counts as back. */
const STABLE_SIGNAL_MS = 30 * 1000;

type SessionState = ReturnType<typeof useSession.getState>;

/** Only an online session has tokens to talk to the API. */
const isOnlineSession = (state: SessionState) =>
  state.status === 'signedIn' && state.mode === 'online';

let engine: ReturnType<typeof createSyncEngine> | null = null;

/**
 * Sends the finished censuses now, also those waiting after a failed send: the census taker
 * asked for it. Does not wait for a download that is running.
 */
export function sendCensusesNow(): Promise<SendOutcome> {
  return engine ? engine.sendNow({ force: true }) : Promise.resolve('skipped');
}

/**
 * Wires the sync engine to its triggers: start-up, an online sign-in, the signal coming back
 * and the app coming back to the front. Only the sign-in skips the minimum interval. Called once,
 * after the session was restored.
 */
export function startSync(): () => void {
  const sync = createSyncEngine({
    canSync: () => isOnlineSession(useSession.getState()),
    sendCensuses: createOutboxSender({
      http: apiClient,
      store: outboxStore,
      // Each census goes only with the token of the user who took it.
      userId: () => {
        const state = useSession.getState();
        return isOnlineSession(state) ? (state.user?.id ?? null) : null;
      },
    }),
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
  engine = sync;
  const syncNow = () => void sync.syncNow();

  const session = useSession.subscribe((state, previous) => {
    if (isOnlineSession(state) && !isOnlineSession(previous)) void sync.syncNow({ force: true });
  });
  const network = onStableSignal(syncNow, STABLE_SIGNAL_MS);
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') syncNow();
  });
  syncNow();

  return () => {
    engine = null;
    session();
    network();
    appState.remove();
  };
}

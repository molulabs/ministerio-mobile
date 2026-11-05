import { PBKDF2_ITERATIONS, pbkdf2Sha256Hex, randomHex } from '@/src/infrastructure/crypto/pbkdf2';
import { secureStore } from '@/src/infrastructure/storage/secureStore';

import { createOfflineCredentials, type OfflineCredential } from './offlineCredentials';

const keys = {
  credentials: 'auth.offline.credentials',
  lastSeenAt: 'auth.offline.lastSeenAt',
} as const;

/** The phone's offline credentials, kept in SecureStore. Signing out never removes them. */
export const offlineCredentials = createOfflineCredentials({
  read: async () =>
    (await secureStore.getJson<Record<string, OfflineCredential>>(keys.credentials)) ?? {},
  write: (credentials) => secureStore.setJson(keys.credentials, credentials),
  readLastSeenAt: async () => {
    const value = await secureStore.get(keys.lastSeenAt);
    return value === null ? null : Number(value);
  },
  writeLastSeenAt: (time) => secureStore.set(keys.lastSeenAt, String(time)),
  derive: pbkdf2Sha256Hex,
  randomSaltHex: () => randomHex(16),
  iterations: PBKDF2_ITERATIONS,
  now: Date.now,
});

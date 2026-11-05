import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { getDatabase } from '../db/client';
import { syncState } from '../db/schema';

/** Keys of the sync_state table. */
export const syncKeys = {
  /** Epoch ms of the last sync that finished, as text. */
  lastSyncAt: 'lastSyncAt',
} as const;

type SyncKey = (typeof syncKeys)[keyof typeof syncKeys];

/** The value of a key, kept up to date: the component re-renders when the row changes. */
export function useSyncState(key: SyncKey): string | null {
  const { data } = useLiveQuery(
    getDatabase().select().from(syncState).where(eq(syncState.key, key)),
  );
  return data[0]?.value ?? null;
}

export async function setSyncState(key: SyncKey, value: string): Promise<void> {
  const updatedAt = new Date();
  await getDatabase()
    .insert(syncState)
    .values({ key, value, updatedAt })
    .onConflictDoUpdate({ target: syncState.key, set: { value, updatedAt } });
}

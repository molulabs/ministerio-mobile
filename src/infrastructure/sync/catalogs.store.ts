import { eq } from 'drizzle-orm';

import { getDatabase } from '../db/client';
import { forestSpecies, livestockBreeds, localities, producerIndex, syncState } from '../db/schema';
import type { Catalogs, CatalogsStore } from './catalogs.puller';
import { getSyncState, setSyncState, type SyncKey, syncKeys } from './syncState';

/** Rows per INSERT: far below SQLite's limit of bound variables per statement. */
const CHUNK_SIZE = 500;

function chunks<T>(rows: T[]): T[][] {
  const result: T[][] = [];
  for (let start = 0; start < rows.length; start += CHUNK_SIZE) {
    result.push(rows.slice(start, start + CHUNK_SIZE));
  }
  return result;
}

/** The catalogs in SQLite. */
export const catalogsStore: CatalogsStore = {
  etag: () => getSyncState(syncKeys.catalogsEtag),

  async syncedAt() {
    const value = await getSyncState(syncKeys.catalogsSyncedAt);
    return value === null ? null : Number(value);
  },

  async replace(catalogs: Catalogs, etag: string | null, syncedAt: number) {
    const updatedAt = new Date(syncedAt);
    // One transaction (synchronous in the expo-sqlite driver): a failure halfway leaves the
    // previous catalogs, never a mix or empty tables.
    getDatabase().transaction((tx) => {
      const saveState = (key: SyncKey, value: string) =>
        tx
          .insert(syncState)
          .values({ key, value, updatedAt })
          .onConflictDoUpdate({ target: syncState.key, set: { value, updatedAt } })
          .run();

      tx.delete(localities).run();
      tx.delete(livestockBreeds).run();
      tx.delete(forestSpecies).run();
      tx.delete(producerIndex).run();
      for (const rows of chunks(catalogs.localities)) tx.insert(localities).values(rows).run();
      for (const rows of chunks(catalogs.livestockBreeds)) {
        tx.insert(livestockBreeds).values(rows).run();
      }
      for (const rows of chunks(catalogs.forestSpecies))
        tx.insert(forestSpecies).values(rows).run();
      for (const rows of chunks(catalogs.producers)) tx.insert(producerIndex).values(rows).run();

      if (etag) {
        saveState(syncKeys.catalogsEtag, etag);
      } else {
        tx.delete(syncState).where(eq(syncState.key, syncKeys.catalogsEtag)).run();
      }
      saveState(syncKeys.catalogsSyncedAt, String(syncedAt));
      saveState(syncKeys.lastSyncAt, String(syncedAt));
    });
  },

  async markSynced(syncedAt: number) {
    await setSyncState(syncKeys.catalogsSyncedAt, String(syncedAt));
    await setSyncState(syncKeys.lastSyncAt, String(syncedAt));
  },
};

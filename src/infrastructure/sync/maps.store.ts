import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { getDatabase } from '../db/client';
import { mapPackages, syncState } from '../db/schema';
import type { InstalledMapPackage, MapsStore } from './maps.puller';
import { getSyncState, syncKeys } from './syncState';

/** The installed map packages in SQLite. */
export const mapsStore: MapsStore = {
  etag: () => getSyncState(syncKeys.mapsEtag),

  installed: () =>
    getDatabase().select({ id: mapPackages.id, version: mapPackages.version }).from(mapPackages),

  async replace(packages: InstalledMapPackage[], etag: string | null) {
    const installedAt = new Date();
    // One transaction: the map switches to the new packages all at once, or not at all.
    getDatabase().transaction((tx) => {
      tx.delete(mapPackages).run();
      if (packages.length > 0) {
        tx.insert(mapPackages)
          .values(packages.map((map) => ({ ...map, installedAt })))
          .run();
      }
      if (etag) {
        tx.insert(syncState)
          .values({ key: syncKeys.mapsEtag, value: etag, updatedAt: installedAt })
          .onConflictDoUpdate({
            target: syncState.key,
            set: { value: etag, updatedAt: installedAt },
          })
          .run();
      } else {
        tx.delete(syncState).where(eq(syncState.key, syncKeys.mapsEtag)).run();
      }
    });
  },
};

/** The installed packages, kept up to date: the map appears when the download finishes. */
export function useInstalledMapPackages(): InstalledMapPackage[] {
  const { data } = useLiveQuery(getDatabase().select().from(mapPackages));
  return data.map((row) => ({
    id: row.id,
    kind: row.kind as InstalledMapPackage['kind'],
    version: row.version,
    name: row.name,
    bounds: row.bounds ?? null,
    minzoom: row.minzoom,
    maxzoom: row.maxzoom,
    attribution: row.attribution,
    requires: row.requires ?? [],
  }));
}

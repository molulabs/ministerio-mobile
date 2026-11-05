import type { AxiosInstance } from 'axios';

/** The body of GET /api/mobile/catalogs. */
export type Catalogs = {
  localities: { id: number; department: string; name: string }[];
  livestockBreeds: { id: number; species: string; name: string }[];
  forestSpecies: { id: number; name: string }[];
  producers: { documentNumber: string; fullName: string }[];
};

/** Where the catalogs are kept on the phone (SQLite in the app, a fake in tests). */
export type CatalogsStore = {
  /** The ETag of the catalogs saved on the phone, or null if there are none yet. */
  etag(): Promise<string | null>;
  /** When the catalogs were last synced (epoch ms), or null if they were never downloaded. */
  syncedAt(): Promise<number | null>;
  /** Replaces every catalog, its ETag and the sync time: all of it or nothing. */
  replace(catalogs: Catalogs, etag: string | null, syncedAt: number): Promise<void>;
  /** The catalogs did not change: only the sync time. */
  markSynced(syncedAt: number): Promise<void>;
};

export type PullResult = 'updated' | 'unchanged';

export class InvalidCatalogsError extends Error {
  constructor(detail: string) {
    super(`Invalid catalogs response: ${detail}`);
    this.name = 'InvalidCatalogsError';
  }
}

type Deps = {
  http: AxiosInstance;
  store: CatalogsStore;
  now?: () => number;
};

/**
 * Downloads the catalogs whole. With the saved ETag the API answers 304 when nothing changed.
 * A failed request or an invalid body throws and leaves the saved catalogs as they were.
 */
export function createCatalogsPuller({ http, store, now = Date.now }: Deps) {
  return async function pullCatalogs(): Promise<PullResult> {
    const etag = await store.etag();
    const response = await http.get<unknown>('/mobile/catalogs', {
      headers: etag ? { 'If-None-Match': etag } : {},
      validateStatus: (status) => status === 200 || status === 304,
    });

    if (response.status === 304) {
      await store.markSynced(now());
      return 'unchanged';
    }

    const catalogs = parseCatalogs(response.data);
    const newEtag = response.headers.etag;
    await store.replace(catalogs, typeof newEtag === 'string' ? newEtag : null, now());
    return 'updated';
  };
}

type Field = 'number' | 'string';

function parseList<T>(body: Record<string, unknown>, name: string, fields: Record<string, Field>) {
  const list = body[name];
  if (!Array.isArray(list)) throw new InvalidCatalogsError(`${name} is not a list`);
  list.forEach((item: Record<string, unknown>, position) => {
    for (const [field, type] of Object.entries(fields)) {
      if (typeof item?.[field] !== type) {
        throw new InvalidCatalogsError(`${name}[${position}].${field} is not a ${type}`);
      }
    }
  });
  return list as T[];
}

/** Checks the shape before anything is replaced: a bad body must never empty the catalogs. */
export function parseCatalogs(body: unknown): Catalogs {
  if (typeof body !== 'object' || body === null) throw new InvalidCatalogsError('not an object');
  const data = body as Record<string, unknown>;
  return {
    localities: parseList(data, 'localities', {
      id: 'number',
      department: 'string',
      name: 'string',
    }),
    livestockBreeds: parseList(data, 'livestockBreeds', {
      id: 'number',
      species: 'string',
      name: 'string',
    }),
    forestSpecies: parseList(data, 'forestSpecies', { id: 'number', name: 'string' }),
    producers: parseList(data, 'producers', { documentNumber: 'string', fullName: 'string' }),
  };
}

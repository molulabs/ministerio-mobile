import type { AxiosInstance } from 'axios';

/** A farm of a registered producer: enough to choose it and fill its RENSPA. */
export type CatalogFarm = {
  id: number;
  number: number;
  label: string;
  renspa: string | null;
  producerLivesOnFarm: boolean | null;
};

/** The body of GET /api/mobile/catalogs. */
export type Catalogs = {
  localities: { id: number; department: string; name: string }[];
  livestockBreeds: { id: number; species: string; name: string }[];
  forestSpecies: { id: number; name: string }[];
  producers: { documentNumber: string; fullName: string; farms: CatalogFarm[] }[];
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
    producers: parseList<{ documentNumber: string; fullName: string; farms?: unknown }>(
      data,
      'producers',
      { documentNumber: 'string', fullName: 'string' },
    ).map((producer, position) => ({
      documentNumber: producer.documentNumber,
      fullName: producer.fullName,
      farms: parseFarms(producer.farms, position),
    })),
  };
}

const isNullable = (value: unknown, type: Field | 'boolean') =>
  value === null || typeof value === type;

/** An API from before the farms sends none: the producer is still taken, without farms to choose. */
function parseFarms(farms: unknown, producer: number): CatalogFarm[] {
  if (farms === undefined) return [];
  const where = `producers[${producer}].farms`;
  if (!Array.isArray(farms)) throw new InvalidCatalogsError(`${where} is not a list`);
  return farms.map((farm: Record<string, unknown>, position) => {
    const valid =
      typeof farm?.id === 'number' &&
      typeof farm.number === 'number' &&
      typeof farm.label === 'string' &&
      isNullable(farm.renspa, 'string') &&
      isNullable(farm.producerLivesOnFarm, 'boolean');
    if (!valid) throw new InvalidCatalogsError(`${where}[${position}] is not a farm`);
    return {
      id: farm.id as number,
      number: farm.number as number,
      label: farm.label as string,
      renspa: farm.renspa as string | null,
      producerLivesOnFarm: farm.producerLivesOnFarm as boolean | null,
    };
  });
}

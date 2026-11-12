import type { AxiosInstance } from 'axios';

export type MapPackageKind = 'raster' | 'vector' | 'style';

/** One package of GET /api/mobile/maps, as the app uses it. */
export type MapPackage = {
  id: string;
  kind: MapPackageKind;
  version: string;
  format: 'pmtiles' | 'zip';
  size: number;
  sha256: string;
  /** The versioned file name, the last segment of the url. */
  file: string;
  /** Path of the API to download it from, as /api/mobile/maps/files/<file>. */
  url: string;
  bounds: [number, number, number, number] | null;
  minzoom: number | null;
  maxzoom: number | null;
  attribution: string | null;
  requires: string[];
};

/** What the phone has: one row per package, every file complete and checked. */
export type InstalledMapPackage = Pick<
  MapPackage,
  'id' | 'kind' | 'version' | 'bounds' | 'minzoom' | 'maxzoom' | 'attribution' | 'requires'
> & {
  /** Name in the maps directory (see MapFiles.localName). */
  name: string;
};

export type MapsStore = {
  /** The ETag of the manifest whose packages are all installed, or null. */
  etag(): Promise<string | null>;
  installed(): Promise<{ id: string; version: string }[]>;
  /** Replaces the installed packages and the ETag, in one transaction. */
  replace(packages: InstalledMapPackage[], etag: string | null): Promise<void>;
};

export type DownloadProgress = { received: number; total: number };

export type MapFiles = {
  /** Where the package lives in the maps directory once installed. */
  localName(map: MapPackage): string;
  /**
   * Leaves the package complete and checked under its local name: downloads it (going on from a
   * partial file a cut left), checks size and SHA-256, unzips a style. Does nothing if it is there.
   */
  install(
    map: MapPackage,
    url: string,
    headers: Record<string, string>,
    onProgress: (bytes: number) => void,
  ): Promise<void>;
  /** Deletes everything in the maps directory but these names. */
  keepOnly(names: string[]): Promise<void>;
};

export type PullMapsResult = 'updated' | 'unchanged' | 'waitingForWifi';

export class InvalidMapManifestError extends Error {
  constructor(detail: string) {
    super(`Invalid map manifest: ${detail}`);
    this.name = 'InvalidMapManifestError';
  }
}

type Deps = {
  http: AxiosInstance;
  store: MapsStore;
  files: MapFiles;
  /** The API host the package urls are relative to, as http://10.0.2.2:8000. */
  apiOrigin: string;
  /** True on WiFi: the packages weigh close to 200 MB and must not go over mobile data. */
  isUnmetered: () => Promise<boolean>;
  /** Download progress of the packages missing, null once it ends (well or not). */
  onProgress?: (progress: DownloadProgress | null) => void;
};

const MANIFEST = '/mobile/maps';

/**
 * Keeps the offline map up to date. The manifest comes with the saved ETag (304 when nothing
 * changed). Missing packages are downloaded only on WiFi, each to its own versioned name, and the
 * map switches to the new ones only when all of them are in place: the style is never shown with
 * tiles of another version. A failure keeps the installed map and what was downloaded so far.
 */
export function createMapsPuller({ http, store, files, apiOrigin, isUnmetered, onProgress }: Deps) {
  const getManifest = (etag: string | null) =>
    http.get<unknown>(MANIFEST, {
      headers: etag ? { 'If-None-Match': etag } : {},
      validateStatus: (status) => status === 200 || status === 304,
    });

  return async function pullMaps(): Promise<PullMapsResult> {
    const response = await getManifest(await store.etag());
    if (response.status === 304) return 'unchanged';

    const manifest = parseMapManifest(response.data);
    const etag = typeof response.headers.etag === 'string' ? response.headers.etag : null;
    const installed = await store.installed();
    const missing = manifest.filter(
      (map) => !installed.some((row) => row.id === map.id && row.version === map.version),
    );

    if (missing.length > 0) {
      if (!(await isUnmetered())) return 'waitingForWifi';

      const total = missing.reduce((sum, map) => sum + map.size, 0);
      let done = 0;
      try {
        for (const map of missing) {
          // A cheap request first: on an expired token (it lasts 1 hour, a download can take
          // longer) the client refreshes it before the native download, which cannot.
          await getManifest(etag);
          onProgress?.({ received: done, total });
          await files.install(map, apiOrigin + map.url, authorization(http), (bytes) =>
            onProgress?.({ received: done + bytes, total }),
          );
          done += map.size;
        }
      } finally {
        onProgress?.(null);
      }
    }

    const packages = manifest.map((map) => ({
      id: map.id,
      kind: map.kind,
      version: map.version,
      name: files.localName(map),
      bounds: map.bounds,
      minzoom: map.minzoom,
      maxzoom: map.maxzoom,
      attribution: map.attribution,
      requires: map.requires,
    }));
    await store.replace(packages, etag);
    await files.keepOnly(packages.map((map) => map.name));
    return missing.length > 0 ? 'updated' : 'unchanged';
  };
}

/** The bearer token the API client sends: the native download does not go through axios. */
function authorization(http: AxiosInstance): Record<string, string> {
  const value = http.defaults.headers.common.Authorization;
  return typeof value === 'string' ? { Authorization: value } : {};
}

/** A file name the API gives: never a path, so it cannot write outside the maps directory. */
const FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const KINDS: MapPackageKind[] = ['raster', 'vector', 'style'];

/**
 * Checks the manifest before anything is downloaded and keeps the packages the app must have
 * (required). A style that reads a package the manifest does not bring is an error: it would
 * draw nothing.
 */
export function parseMapManifest(body: unknown): MapPackage[] {
  const list = (body as { packages?: unknown } | null)?.packages;
  if (!Array.isArray(list)) throw new InvalidMapManifestError('packages is not a list');

  const packages = list
    .filter((item) => item?.required === true)
    .map((item: Record<string, unknown>, position): MapPackage => {
      const fail = (field: string) => {
        throw new InvalidMapManifestError(`packages[${position}].${field} is not valid`);
      };
      const text = (field: string) =>
        typeof item[field] === 'string' && item[field] !== ''
          ? (item[field] as string)
          : fail(field);
      const optional = <T>(field: string, valid: (value: unknown) => boolean) =>
        item[field] == null ? null : valid(item[field]) ? (item[field] as T) : fail(field);

      const kind = text('kind') as MapPackageKind;
      if (!KINDS.includes(kind)) fail('kind');
      const format = text('format');
      if (format !== (kind === 'style' ? 'zip' : 'pmtiles')) fail('format');
      const url = text('url');
      const file = url.slice(url.lastIndexOf('/') + 1);
      if (!url.startsWith('/') || !FILE_NAME.test(file)) fail('url');
      const size = item.size;
      if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0) fail('size');
      const sha256 = text('sha256');
      if (!/^[0-9a-f]{64}$/.test(sha256)) fail('sha256');

      return {
        id: text('id'),
        kind,
        version: text('version'),
        format: format as MapPackage['format'],
        size: size as number,
        sha256,
        file,
        url,
        bounds: optional(
          'bounds',
          (value) =>
            Array.isArray(value) && value.length === 4 && value.every((n) => typeof n === 'number'),
        ),
        minzoom: optional('minzoom', Number.isInteger),
        maxzoom: optional('maxzoom', Number.isInteger),
        attribution: optional('attribution', (value) => typeof value === 'string'),
        requires:
          optional<string[]>(
            'requires',
            (value) => Array.isArray(value) && value.every((id) => typeof id === 'string'),
          ) ?? [],
      };
    });

  const ids = packages.map((map) => map.id);
  for (const map of packages) {
    const absent = map.requires.find((id) => !ids.includes(id));
    if (absent) throw new InvalidMapManifestError(`${map.id} reads ${absent}, which is not in it`);
  }
  if (!packages.some((map) => map.kind === 'style')) throw new InvalidMapManifestError('no style');
  return packages;
}

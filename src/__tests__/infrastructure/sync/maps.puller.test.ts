import { type AxiosAdapter, type AxiosResponse, create } from 'axios';

import {
  createMapsPuller,
  type InstalledMapPackage,
  InvalidMapManifestError,
  type MapFiles,
  parseMapManifest,
} from '@/src/infrastructure/sync/maps.puller';

const sha = (char: string) => char.repeat(64);

const manifest = {
  packages: [
    {
      id: 'jujuy-satelite',
      kind: 'raster',
      version: '2016-aaaa',
      format: 'pmtiles',
      required: true,
      size: 300,
      sha256: sha('a'),
      url: '/api/mobile/maps/files/jujuy-satelite-2016-aaaa.pmtiles',
      bounds: [-67.2, -24.6, -64.1, -21.7],
      minzoom: 0,
      maxzoom: 14,
      attribution: 'Sentinel-2 cloudless',
    },
    {
      id: 'estilo',
      kind: 'style',
      version: 'bbbb',
      format: 'zip',
      required: true,
      size: 100,
      sha256: sha('b'),
      url: '/api/mobile/maps/files/estilo-bbbb.zip',
      unpackedSize: 200,
      requires: ['jujuy-satelite'],
    },
  ],
};

type Reply = { status: number; data?: unknown; etag?: string };

function fakeApi(replies: Reply[]) {
  const ifNoneMatch: (string | undefined)[] = [];
  const adapter: AxiosAdapter = async (config) => {
    ifNoneMatch.push(config.headers['If-None-Match'] as string | undefined);
    const reply = replies.shift() ?? { status: 304 };
    const response: AxiosResponse = {
      data: reply.data ?? '',
      status: reply.status,
      statusText: String(reply.status),
      headers: reply.etag ? { etag: reply.etag } : {},
      config,
    };
    return response;
  };
  const http = create({ adapter });
  http.defaults.headers.common.Authorization = 'Bearer token';
  return { http, ifNoneMatch };
}

function setup({
  replies,
  installed = [] as { id: string; version: string }[],
  etag = null as string | null,
  unmetered = true,
  install = jest.fn(async () => undefined) as jest.Mock,
}: {
  replies: Reply[];
  installed?: { id: string; version: string }[];
  etag?: string | null;
  unmetered?: boolean;
  install?: jest.Mock;
}) {
  const { http, ifNoneMatch } = fakeApi(replies);
  const store = {
    etag: jest.fn(async () => etag),
    installed: jest.fn(async () => installed),
    replace: jest.fn(async (_packages: InstalledMapPackage[], _etag: string | null) => undefined),
  };
  const files: MapFiles = {
    localName: (map) => (map.format === 'zip' ? map.file.replace(/\.zip$/, '') : map.file),
    install,
    keepOnly: jest.fn(async () => undefined),
  };
  const onProgress = jest.fn();
  const pullMaps = createMapsPuller({
    http,
    store,
    files,
    apiOrigin: 'http://api',
    isUnmetered: async () => unmetered,
    onProgress,
  });
  return { pullMaps, store, files, install, onProgress, ifNoneMatch };
}

describe('mapsPuller', () => {
  it('downloads every package and then installs them together', async () => {
    const { pullMaps, store, files, install } = setup({
      replies: [{ status: 200, data: manifest, etag: '"v1"' }],
    });

    await expect(pullMaps()).resolves.toBe('updated');

    expect(install.mock.calls.map((call) => call[1])).toEqual([
      'http://api/api/mobile/maps/files/jujuy-satelite-2016-aaaa.pmtiles',
      'http://api/api/mobile/maps/files/estilo-bbbb.zip',
    ]);
    expect(install.mock.calls[0][2]).toEqual({ Authorization: 'Bearer token' });
    const [packages, etag] = store.replace.mock.calls[0];
    expect(etag).toBe('"v1"');
    expect(packages.map((map) => [map.id, map.name])).toEqual([
      ['jujuy-satelite', 'jujuy-satelite-2016-aaaa.pmtiles'],
      ['estilo', 'estilo-bbbb'],
    ]);
    expect(packages[1].requires).toEqual(['jujuy-satelite']);
    expect(files.keepOnly).toHaveBeenCalledWith([
      'jujuy-satelite-2016-aaaa.pmtiles',
      'estilo-bbbb',
    ]);
  });

  it('does nothing when the manifest did not change (304)', async () => {
    const { pullMaps, store, install, ifNoneMatch } = setup({
      replies: [{ status: 304 }],
      etag: '"v1"',
    });

    await expect(pullMaps()).resolves.toBe('unchanged');

    expect(ifNoneMatch[0]).toBe('"v1"');
    expect(install).not.toHaveBeenCalled();
    expect(store.replace).not.toHaveBeenCalled();
  });

  it('only downloads the packages whose version is not installed', async () => {
    const { pullMaps, install } = setup({
      replies: [{ status: 200, data: manifest, etag: '"v2"' }],
      installed: [
        { id: 'jujuy-satelite', version: '2016-aaaa' },
        { id: 'estilo', version: 'old' },
      ],
    });

    await expect(pullMaps()).resolves.toBe('updated');

    expect(install.mock.calls.map((call) => call[0].id)).toEqual(['estilo']);
  });

  it('waits for WiFi and keeps the installed map', async () => {
    const { pullMaps, store, install } = setup({
      replies: [{ status: 200, data: manifest, etag: '"v1"' }],
      unmetered: false,
    });

    await expect(pullMaps()).resolves.toBe('waitingForWifi');

    expect(install).not.toHaveBeenCalled();
    expect(store.replace).not.toHaveBeenCalled();
  });

  it('keeps the installed map when a download fails', async () => {
    const { pullMaps, store, onProgress } = setup({
      replies: [{ status: 200, data: manifest, etag: '"v1"' }],
      install: jest.fn(async () => {
        throw new Error('cut');
      }),
    });

    await expect(pullMaps()).rejects.toThrow('cut');

    expect(store.replace).not.toHaveBeenCalled();
    expect(onProgress).toHaveBeenLastCalledWith(null);
  });

  it('reports the progress over all the packages missing', async () => {
    const { pullMaps, onProgress } = setup({
      replies: [{ status: 200, data: manifest, etag: '"v1"' }],
      install: jest.fn(async (_map, _url, _headers, progress: (bytes: number) => void) =>
        progress(50),
      ),
    });

    await pullMaps();

    expect(onProgress.mock.calls.map((call) => call[0])).toEqual([
      { received: 0, total: 400 },
      { received: 50, total: 400 },
      { received: 300, total: 400 },
      { received: 350, total: 400 },
      null,
    ]);
  });
});

describe('parseMapManifest', () => {
  const withPackage = (change: Record<string, unknown>) => ({
    packages: [{ ...manifest.packages[0], ...change }, manifest.packages[1]],
  });

  it('leaves out the packages that are not required', () => {
    const optional = { ...manifest.packages[0], id: 'extra', required: false };
    const packages = parseMapManifest({ packages: [...manifest.packages, optional] });

    expect(packages.map((map) => map.id)).toEqual(['jujuy-satelite', 'estilo']);
  });

  it.each([
    ['a url that is a path outside the maps directory', { url: '/api/mobile/maps/files/..' }],
    ['a file name with a slash', { url: '/api/x/sub%2F..%2Fdb' }],
    ['an absolute url to another host', { url: 'https://evil/x.pmtiles' }],
    ['a bad digest', { sha256: 'abc' }],
    ['a size that is not a positive integer', { size: 0 }],
    ['a tile package that is a zip', { format: 'zip' }],
  ])('refuses %s', (_, change) => {
    expect(() => parseMapManifest(withPackage(change))).toThrow(InvalidMapManifestError);
  });

  it('refuses a style that reads a package the manifest does not bring', () => {
    expect(() => parseMapManifest({ packages: [manifest.packages[1]] })).toThrow(
      InvalidMapManifestError,
    );
  });
});

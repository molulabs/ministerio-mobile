import {
  type AxiosAdapter,
  AxiosError,
  type AxiosResponse,
  create,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  type Catalogs,
  type CatalogsStore,
  createCatalogsPuller,
  InvalidCatalogsError,
} from '@/src/infrastructure/sync/catalogs.puller';

type Reply = { status: number; data?: unknown; etag?: string } | 'network';

const catalogs: Catalogs = {
  municipalities: [{ id: 4, department: 'DOCTOR_MANUEL_BELGRANO', name: 'San Salvador de Jujuy' }],
  localities: [
    {
      id: 155,
      department: 'DOCTOR_MANUEL_BELGRANO',
      name: 'San Salvador de Jujuy',
      municipalityId: 4,
    },
  ],
  livestockBreeds: [{ id: 1, species: 'CATTLE', name: 'Criolla' }],
  forestSpecies: [{ id: 7, name: 'Algarrobo' }],
  producers: [
    {
      documentNumber: '22333444',
      fullName: 'Maria Simulada',
      farms: [
        {
          id: 3,
          number: 1,
          label: 'Finca 1 · Sin RENSPA',
          renspa: null,
          producerLivesOnFarm: true,
        },
      ],
    },
  ],
};

/** A fake API that answers each request with the next reply and records If-None-Match. */
function fakeApi(replies: Reply[]) {
  const ifNoneMatch: (string | undefined)[] = [];
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    ifNoneMatch.push(config.headers['If-None-Match'] as string | undefined);
    const reply = replies.shift();
    if (!reply) throw new Error('Unexpected request');
    if (reply === 'network') throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
    const response: AxiosResponse = {
      data: reply.data ?? '',
      status: reply.status,
      statusText: String(reply.status),
      headers: reply.etag ? { etag: reply.etag } : {},
      config,
    };
    // Like axios' own adapters: the status is checked against the request's validateStatus.
    if (config.validateStatus && !config.validateStatus(reply.status)) {
      throw new AxiosError('Bad status', AxiosError.ERR_BAD_RESPONSE, config, null, response);
    }
    return response;
  };
  return { http: create({ adapter }), ifNoneMatch };
}

type Saved = { etag: string | null; catalogs: Catalogs | null; syncedAt: number | null };

function fakeStore(etag: string | null = null) {
  const saved: { current: Saved } = { current: { etag, catalogs: null, syncedAt: null } };
  const store = {
    etag: jest.fn(async () => saved.current.etag),
    syncedAt: jest.fn(async () => saved.current.syncedAt),
    replace: jest.fn(async (next: Catalogs, nextEtag: string | null, syncedAt: number) => {
      saved.current = { etag: nextEtag, catalogs: next, syncedAt };
    }),
    markSynced: jest.fn(async (syncedAt: number) => {
      saved.current = { ...saved.current, syncedAt };
    }),
  } satisfies CatalogsStore;
  // A function, not a getter: Babel copies a getter's value once when it compiles the spread.
  return { ...store, saved: () => saved.current };
}

const now = () => 1_000;

describe('pullCatalogs', () => {
  it('saves the catalogs and their ETag on the first download', async () => {
    const api = fakeApi([{ status: 200, data: catalogs, etag: '"v1"' }]);
    const store = fakeStore();
    const pull = createCatalogsPuller({ http: api.http, store, now });

    await expect(pull()).resolves.toBe('updated');

    expect(api.ifNoneMatch).toEqual([undefined]);
    expect(store.saved()).toEqual({ etag: '"v1"', catalogs, syncedAt: 1_000 });
  });

  it('sends the saved ETag and only updates the sync time on a 304', async () => {
    const api = fakeApi([{ status: 304 }]);
    const store = fakeStore('"v1"');
    const pull = createCatalogsPuller({ http: api.http, store, now });

    await expect(pull()).resolves.toBe('unchanged');

    expect(api.ifNoneMatch).toEqual(['"v1"']);
    expect(store.replace).not.toHaveBeenCalled();
    expect(store.markSynced).toHaveBeenCalledWith(1_000);
  });

  it('replaces the catalogs when the API has a new version', async () => {
    const next = { ...catalogs, forestSpecies: [] };
    const api = fakeApi([{ status: 200, data: next, etag: '"v2"' }]);
    const store = fakeStore('"v1"');
    const pull = createCatalogsPuller({ http: api.http, store, now });

    await pull();

    expect(store.saved()).toEqual({ etag: '"v2"', catalogs: next, syncedAt: 1_000 });
  });

  it('keeps the saved catalogs when there is no signal', async () => {
    const store = fakeStore('"v1"');
    const pull = createCatalogsPuller({ http: fakeApi(['network']).http, store, now });

    await expect(pull()).rejects.toThrow('Network Error');

    expect(store.replace).not.toHaveBeenCalled();
    expect(store.markSynced).not.toHaveBeenCalled();
  });

  it('keeps the saved catalogs when the API fails', async () => {
    const store = fakeStore('"v1"');
    const pull = createCatalogsPuller({ http: fakeApi([{ status: 500 }]).http, store, now });

    await expect(pull()).rejects.toThrow();

    expect(store.replace).not.toHaveBeenCalled();
  });

  it('takes the producers of an API from before the farms, without farms', async () => {
    const store = fakeStore(null);
    const data = {
      ...catalogs,
      producers: [{ documentNumber: '22333444', fullName: 'Maria Simulada' }],
    };
    const pull = createCatalogsPuller({ http: fakeApi([{ status: 200, data }]).http, store, now });

    await pull();

    expect(store.saved().catalogs?.producers).toEqual([
      { documentNumber: '22333444', fullName: 'Maria Simulada', farms: [] },
    ]);
  });

  it('takes the localities of an API from before the municipalities, without municipality', async () => {
    const store = fakeStore(null);
    const { municipalities: _, ...data } = {
      ...catalogs,
      localities: [
        { id: 155, department: 'DOCTOR_MANUEL_BELGRANO', name: 'San Salvador de Jujuy' },
      ],
    };
    const pull = createCatalogsPuller({ http: fakeApi([{ status: 200, data }]).http, store, now });

    await pull();

    expect(store.saved().catalogs?.municipalities).toEqual([]);
    expect(store.saved().catalogs?.localities).toEqual([
      {
        id: 155,
        department: 'DOCTOR_MANUEL_BELGRANO',
        name: 'San Salvador de Jujuy',
        municipalityId: null,
      },
    ]);
  });

  it.each([
    ['a body that is not an object', 'oops'],
    ['a missing list', { ...catalogs, producers: undefined }],
    ['an item with a wrong field', { ...catalogs, localities: [{ id: '155', name: 'X' }] }],
    [
      'a locality with a wrong municipality',
      { ...catalogs, localities: [{ ...catalogs.localities[0], municipalityId: '4' }] },
    ],
    ['a municipality with a wrong field', { ...catalogs, municipalities: [{ id: 4, name: 1 }] }],
    [
      'a farm with a wrong field',
      { ...catalogs, producers: [{ ...catalogs.producers[0], farms: [{ id: 3, label: 1 }] }] },
    ],
  ])('never replaces the catalogs with %s', async (_case, data) => {
    const store = fakeStore('"v1"');
    const pull = createCatalogsPuller({ http: fakeApi([{ status: 200, data }]).http, store, now });

    await expect(pull()).rejects.toBeInstanceOf(InvalidCatalogsError);

    expect(store.replace).not.toHaveBeenCalled();
  });
});

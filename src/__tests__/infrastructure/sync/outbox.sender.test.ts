import {
  type AxiosAdapter,
  AxiosError,
  type AxiosResponse,
  create,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { CensusFieldError } from '@/src/infrastructure/db/schema';
import {
  backoffMs,
  createOutboxSender,
  type OutboxCensus,
  type OutboxStore,
} from '@/src/infrastructure/sync/outbox.sender';

type Reply = { status: number; data?: unknown } | 'network';

const ROSA = 7;
const NOW = Date.UTC(2026, 10, 13, 12);
const MINUTE = 60_000;

const FIRST = '019a7b2c-0000-7000-8000-000000000001';
const SECOND = '019a7b2c-0000-7000-8000-000000000002';

/** A fake API that answers each request with the next reply and records what was sent. */
function fakeApi(replies: Reply[]) {
  const requests: { method?: string; url?: string; body: unknown }[] = [];
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    requests.push({ method: config.method, url: config.url, body: JSON.parse(config.data) });
    const reply = replies.shift();
    if (!reply) throw new Error('Unexpected request');
    if (reply === 'network') throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
    const response: AxiosResponse = {
      data: reply.data ?? '',
      status: reply.status,
      statusText: String(reply.status),
      headers: {},
      config,
    };
    // Like axios' own adapters: the status is checked against the request's validateStatus.
    if (config.validateStatus && !config.validateStatus(reply.status)) {
      throw new AxiosError('Bad status', AxiosError.ERR_BAD_RESPONSE, config, null, response);
    }
    return response;
  };
  return { http: create({ adapter }), requests };
}

type Row = OutboxCensus & {
  userId: number;
  status: string;
  censusId?: number | null;
  conflict?: string | null;
  errors?: CensusFieldError[];
};

function census(id: string, extra: Partial<Row> = {}): Row {
  return {
    id,
    userId: ROSA,
    status: 'ready',
    payload: { schemaVersion: 2, formNumber: id.slice(-1) },
    attempts: 0,
    nextAttemptAt: null,
    ...extra,
  };
}

/** The censuses in memory, changed the way the SQLite store changes them. */
function fakeStore(rows: Row[]) {
  const change = (id: string, next: Partial<Row>) => {
    Object.assign(
      rows.find((row) => row.id === id)!,
      next,
    );
  };
  const store: OutboxStore = {
    ready: async (userId) =>
      rows
        .filter((row) => row.userId === userId && row.status === 'ready')
        .map((row) => ({ ...row })),
    markSent: async (id, censusId) => change(id, { status: 'sent', censusId }),
    markInReview: async (id, conflict) => change(id, { status: 'in_review', conflict }),
    markNeedsFix: async (id, errors) => change(id, { status: 'needs_fix', errors }),
    markAnomaly: async (id) => change(id, { status: 'anomaly' }),
    markFailed: async (id, attempts, nextAttemptAt) => change(id, { attempts, nextAttemptAt }),
  };
  return store;
}

function sender(rows: Row[], replies: Reply[], userId: number | null = ROSA) {
  const api = fakeApi(replies);
  const send = createOutboxSender({
    http: api.http,
    store: fakeStore(rows),
    userId: () => userId,
    now: () => NOW,
  });
  return { send, requests: api.requests };
}

describe('outbox sender', () => {
  it('sends each census with a PUT under its own id, oldest first', async () => {
    const rows = [census(FIRST), census(SECOND)];
    const { send, requests } = sender(rows, [
      { status: 201, data: { id: FIRST, status: 'ACCEPTED', censusId: 41, conflict: null } },
      { status: 201, data: { id: SECOND, status: 'ACCEPTED', censusId: 42, conflict: null } },
    ]);

    const result = await send();

    expect(requests).toEqual([
      { method: 'put', url: `/mobile/census-submissions/${FIRST}`, body: rows[0].payload },
      { method: 'put', url: `/mobile/census-submissions/${SECOND}`, body: rows[1].payload },
    ]);
    expect(rows.map((row) => [row.status, row.censusId])).toEqual([
      ['sent', 41],
      ['sent', 42],
    ]);
    expect(result).toEqual({ sent: 2, inReview: 0, needsFix: 0, anomalies: 0, waiting: 0 });
  });

  it('leaves a census the API kept for an operator as in review', async () => {
    const rows = [census(FIRST)];
    const conflict = 'Ya existe un censo con el número de formulario "F-0001".';
    const { send } = sender(rows, [
      { status: 202, data: { id: FIRST, status: 'CONFLICT', censusId: null, conflict } },
    ]);

    const result = await send();

    expect(rows[0]).toMatchObject({ status: 'in_review', conflict });
    expect(result.inReview).toBe(1);
  });

  it('keeps the errors of a rejected census, to fix it', async () => {
    const rows = [census(FIRST)];
    const errors = [{ field: 'livestock.hasCattle', message: 'Este valor no debería ser nulo.' }];
    const { send } = sender(rows, [
      { status: 422, data: { message: 'Error en alguno de los campos', errors } },
    ]);

    const result = await send();

    expect(rows[0]).toMatchObject({ status: 'needs_fix', errors });
    expect(result.needsFix).toBe(1);
  });

  it('never sends again a census whose id the API has for another one', async () => {
    const rows = [census(FIRST)];
    const { send, requests } = sender(rows, [{ status: 409 }]);

    const result = await send();
    await send({ force: true });

    expect(rows[0].status).toBe('anomaly');
    expect(result.anomalies).toBe(1);
    expect(requests).toHaveLength(1);
  });

  it.each([
    ['no signal', 'network' as const],
    ['a server failure', { status: 503 }],
  ])(
    'keeps the census ready after %s and stops: the next ones would fail too',
    async (_, reply) => {
      const rows = [census(FIRST), census(SECOND)];
      const { send, requests } = sender(rows, [reply]);

      const result = await send();

      expect(requests).toHaveLength(1);
      expect(rows[0]).toMatchObject({ status: 'ready', attempts: 1, nextAttemptAt: NOW + MINUTE });
      expect(rows[1]).toMatchObject({ status: 'ready', attempts: 0, nextAttemptAt: null });
      expect(result).toEqual({ sent: 0, inReview: 0, needsFix: 0, anomalies: 0, waiting: 2 });
    },
  );

  it('waits longer after each failed send, up to half an hour', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(backoffMs)).toEqual(
      [1, 2, 4, 8, 16, 30, 30].map((minutes) => minutes * MINUTE),
    );
  });

  it('does not send a census before its next attempt is due', async () => {
    const rows = [
      census(FIRST, { attempts: 2, nextAttemptAt: NOW + 1 }),
      census(SECOND, { attempts: 1, nextAttemptAt: NOW }),
    ];
    const { send, requests } = sender(rows, [{ status: 201, data: { censusId: 42 } }]);

    const result = await send();

    expect(requests.map((request) => request.url)).toEqual([
      `/mobile/census-submissions/${SECOND}`,
    ]);
    expect(result).toMatchObject({ sent: 1, waiting: 1 });
  });

  it('sends it anyway when the census taker asks', async () => {
    const rows = [census(FIRST, { attempts: 2, nextAttemptAt: NOW + 1 })];
    const { send } = sender(rows, [{ status: 201, data: { censusId: 41 } }]);

    await send({ force: true });

    expect(rows[0].status).toBe('sent');
  });

  it('stops without counting a failure when the session is gone', async () => {
    const rows = [census(FIRST), census(SECOND)];
    const { send, requests } = sender(rows, [{ status: 401 }]);

    const result = await send();

    expect(requests).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: 'ready', attempts: 0, nextAttemptAt: null });
    expect(result.waiting).toBe(2);
  });

  it('goes on with the next census after an answer it does not know', async () => {
    const rows = [census(FIRST), census(SECOND)];
    const { send } = sender(rows, [{ status: 400 }, { status: 201, data: { censusId: 42 } }]);

    const result = await send();

    expect(rows[0]).toMatchObject({ status: 'ready', attempts: 1, nextAttemptAt: NOW + MINUTE });
    expect(rows[1].status).toBe('sent');
    expect(result).toMatchObject({ sent: 1, waiting: 1 });
  });

  it('sends only the censuses of the signed-in user', async () => {
    const rows = [census(FIRST, { userId: 8 }), census(SECOND)];
    const { send, requests } = sender(rows, [{ status: 201, data: { censusId: 42 } }]);

    await send();

    expect(requests.map((request) => request.url)).toEqual([
      `/mobile/census-submissions/${SECOND}`,
    ]);
    expect(rows[0].status).toBe('ready');
  });

  it('sends nothing without an online session', async () => {
    const rows = [census(FIRST)];
    const { send, requests } = sender(rows, [], null);

    const result = await send();

    expect(requests).toHaveLength(0);
    expect(result.waiting).toBe(0);
  });
});

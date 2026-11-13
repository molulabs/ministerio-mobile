import type { SendResult } from '@/src/infrastructure/sync/outbox.sender';
import { createSyncEngine } from '@/src/infrastructure/sync/syncEngine';

const MINUTE = 60 * 1000;
const NOTHING_SENT: SendResult = { sent: 0, inReview: 0, needsFix: 0, anomalies: 0, waiting: 0 };

type SendCensuses = (options: { force: boolean }) => Promise<SendResult>;

function setup({
  canSync = true,
  syncedAt = null as number | null,
  pullCatalogs = jest.fn(async () => undefined) as jest.Mock<Promise<unknown>, []>,
  pullMaps = jest.fn(async () => undefined) as jest.Mock<Promise<unknown>, []>,
  sendCensuses = jest.fn(async () => NOTHING_SENT) as SendCensuses,
} = {}) {
  const engine = createSyncEngine({
    canSync: () => canSync,
    sendCensuses,
    pullCatalogs,
    pullMaps,
    catalogsSyncedAt: async () => syncedAt,
    minIntervalMs: 15 * MINUTE,
    now: () => 100 * MINUTE,
  });
  return { engine, pullCatalogs, pullMaps, sendCensuses };
}

describe('syncEngine', () => {
  it('does nothing without an online session', async () => {
    const { engine, pullCatalogs } = setup({ canSync: false });

    await expect(engine.syncNow({ force: true })).resolves.toBe('skipped');

    expect(pullCatalogs).not.toHaveBeenCalled();
  });

  it('downloads catalogs that were never downloaded', async () => {
    const { engine, pullCatalogs } = setup();

    await expect(engine.syncNow()).resolves.toBe('done');

    expect(pullCatalogs).toHaveBeenCalledTimes(1);
  });

  it('pulls the map after the catalogs', async () => {
    const order: string[] = [];
    const { engine } = setup({
      pullCatalogs: jest.fn(async () => order.push('catalogs')),
      pullMaps: jest.fn(async () => order.push('maps')),
    });

    await expect(engine.syncNow()).resolves.toBe('done');

    expect(order).toEqual(['catalogs', 'maps']);
  });

  it('fails when the map fails, keeping the catalogs already pulled', async () => {
    const { engine, pullCatalogs } = setup({
      pullMaps: jest.fn(async () => {
        throw new Error('cut');
      }),
    });

    await expect(engine.syncNow()).resolves.toBe('failed');

    expect(pullCatalogs).toHaveBeenCalledTimes(1);
  });

  it('does not pull again within the minimum interval', async () => {
    const { engine, pullCatalogs } = setup({ syncedAt: 90 * MINUTE });

    await expect(engine.syncNow()).resolves.toBe('recent');

    expect(pullCatalogs).not.toHaveBeenCalled();
  });

  it('pulls again once the minimum interval passed', async () => {
    const { engine, pullCatalogs } = setup({ syncedAt: 85 * MINUTE });

    await expect(engine.syncNow()).resolves.toBe('done');

    expect(pullCatalogs).toHaveBeenCalledTimes(1);
  });

  it('pulls right away when forced (an online sign-in)', async () => {
    const { engine, pullCatalogs } = setup({ syncedAt: 99 * MINUTE });

    await expect(engine.syncNow({ force: true })).resolves.toBe('done');

    expect(pullCatalogs).toHaveBeenCalledTimes(1);
  });

  it('joins a sync that is already running instead of starting another', async () => {
    let finish!: () => void;
    const { engine, pullCatalogs } = setup({
      pullCatalogs: jest.fn(() => new Promise<unknown>((resolve) => (finish = () => resolve(0)))),
    });

    const first = engine.syncNow();
    const second = engine.syncNow();
    // The censuses go first: the catalogs are asked a few turns later.
    while (pullCatalogs.mock.calls.length === 0) await Promise.resolve();
    finish();

    await expect(Promise.all([first, second])).resolves.toEqual(['done', 'done']);
    expect(pullCatalogs).toHaveBeenCalledTimes(1);
  });

  it('does not lose a forced sync behind one that found nothing to do', async () => {
    const { engine, pullCatalogs } = setup({ syncedAt: 99 * MINUTE });

    const automatic = engine.syncNow();
    const signIn = engine.syncNow({ force: true });

    await expect(Promise.all([automatic, signIn])).resolves.toEqual(['recent', 'done']);
    expect(pullCatalogs).toHaveBeenCalledTimes(1);
  });

  it('sends the censuses before any download', async () => {
    const order: string[] = [];
    const { engine } = setup({
      sendCensuses: jest.fn(async () => {
        order.push('censuses');
        return NOTHING_SENT;
      }),
      pullCatalogs: jest.fn(async () => order.push('catalogs')),
      pullMaps: jest.fn(async () => order.push('maps')),
    });

    await engine.syncNow();

    expect(order).toEqual(['censuses', 'catalogs', 'maps']);
  });

  it('sends the censuses on every trigger, also within the minimum interval', async () => {
    const { engine, sendCensuses, pullCatalogs } = setup({ syncedAt: 99 * MINUTE });

    await expect(engine.syncNow()).resolves.toBe('recent');

    expect(sendCensuses).toHaveBeenCalledWith({ force: false });
    expect(pullCatalogs).not.toHaveBeenCalled();
  });

  it('goes on with the downloads when the censuses could not be read', async () => {
    const { engine, pullCatalogs } = setup({
      sendCensuses: jest.fn(async () => {
        throw new Error('database');
      }),
    });

    await expect(engine.syncNow()).resolves.toBe('done');

    expect(pullCatalogs).toHaveBeenCalledTimes(1);
  });

  it('sends when the census taker asks, without waiting for a download that is running', async () => {
    const sent: SendResult = { ...NOTHING_SENT, sent: 1 };
    const { engine, sendCensuses } = setup({
      // A map download that never ends.
      pullMaps: jest.fn(() => new Promise<unknown>(() => undefined)),
      sendCensuses: jest.fn(async () => sent),
    });

    void engine.syncNow();

    await expect(engine.sendNow({ force: true })).resolves.toEqual(sent);
    expect(sendCensuses).toHaveBeenLastCalledWith({ force: true });
  });

  it('runs one send at a time', async () => {
    let finish!: () => void;
    const sendCensuses = jest
      .fn<Promise<SendResult>, [{ force: boolean }]>()
      .mockImplementationOnce(
        () => new Promise((resolve) => (finish = () => resolve(NOTHING_SENT))),
      )
      .mockResolvedValue(NOTHING_SENT);
    const { engine } = setup({ sendCensuses });

    const first = engine.sendNow();
    const second = engine.sendNow();
    await Promise.resolve();
    expect(sendCensuses).toHaveBeenCalledTimes(1);

    finish();
    await Promise.all([first, second]);
    expect(sendCensuses).toHaveBeenCalledTimes(2);
  });

  it('does not send without an online session', async () => {
    const { engine, sendCensuses } = setup({ canSync: false });

    await expect(engine.sendNow({ force: true })).resolves.toBe('skipped');

    expect(sendCensuses).not.toHaveBeenCalled();
  });

  it('says so when the send failed', async () => {
    const { engine } = setup({
      sendCensuses: jest.fn(async () => {
        throw new Error('database');
      }),
    });

    await expect(engine.sendNow()).resolves.toBe('failed');
  });

  it('reports a failure and runs again on the next trigger', async () => {
    const pullCatalogs = jest
      .fn<Promise<unknown>, []>()
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(undefined);
    const { engine } = setup({ pullCatalogs });

    await expect(engine.syncNow()).resolves.toBe('failed');
    await expect(engine.syncNow()).resolves.toBe('done');
  });
});

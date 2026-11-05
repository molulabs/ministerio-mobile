import { createSyncEngine } from '@/src/infrastructure/sync/syncEngine';

const MINUTE = 60 * 1000;

function setup({
  canSync = true,
  syncedAt = null as number | null,
  pullCatalogs = jest.fn(async () => undefined) as jest.Mock<Promise<unknown>, []>,
} = {}) {
  const engine = createSyncEngine({
    canSync: () => canSync,
    pullCatalogs,
    catalogsSyncedAt: async () => syncedAt,
    minIntervalMs: 15 * MINUTE,
    now: () => 100 * MINUTE,
  });
  return { engine, pullCatalogs };
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
    await Promise.resolve();
    await Promise.resolve();
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

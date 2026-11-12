/** done: synced; skipped: no online session; recent: synced shortly before, nothing to do. */
export type SyncOutcome = 'done' | 'skipped' | 'recent' | 'failed';

type Deps = {
  /** False without an online session (an offline sign-in has no tokens): nothing is sent. */
  canSync: () => boolean;
  pullCatalogs: () => Promise<unknown>;
  /** Runs last: downloading the map can take minutes, and nothing else waits behind it. */
  pullMaps: () => Promise<unknown>;
  /** When the catalogs were last synced, or null if they were never downloaded. */
  catalogsSyncedAt: () => Promise<number | null>;
  /** Automatic triggers do not pull the catalogs again within this time. */
  minIntervalMs: number;
  now?: () => number;
};

type SyncOptions = {
  /** Skips the minimum interval: an online sign-in syncs right away. */
  force?: boolean;
};

/**
 * Runs the sync steps one at a time: a trigger that arrives while a sync runs joins it instead
 * of starting another, and automatic triggers within minIntervalMs of the last sync do nothing.
 * A failure keeps what the phone has and waits for the next trigger.
 */
export function createSyncEngine({
  canSync,
  pullCatalogs,
  pullMaps,
  catalogsSyncedAt,
  minIntervalMs,
  now = Date.now,
}: Deps) {
  let running: Promise<SyncOutcome> | null = null;

  async function run(force: boolean): Promise<SyncOutcome> {
    try {
      if (!force) {
        const last = await catalogsSyncedAt();
        if (last !== null && now() - last < minIntervalMs) return 'recent';
      }
      await pullCatalogs();
      await pullMaps();
      return 'done';
    } catch {
      return 'failed';
    } finally {
      running = null;
    }
  }

  function syncNow({ force = false }: SyncOptions = {}): Promise<SyncOutcome> {
    if (running) {
      // A forced sync must not be lost behind one that found nothing to do.
      return force
        ? running.then((outcome) => (outcome === 'recent' ? syncNow({ force }) : outcome))
        : running;
    }
    if (!canSync()) return Promise.resolve('skipped');
    running = run(force);
    return running;
  }

  return { syncNow };
}

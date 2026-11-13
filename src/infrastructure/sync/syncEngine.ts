import type { SendResult } from './outbox.sender';

/** done: synced; skipped: no online session; recent: synced shortly before, nothing to do. */
export type SyncOutcome = 'done' | 'skipped' | 'recent' | 'failed';

/** What a send did; skipped: no online session; failed: the phone could not read its censuses. */
export type SendOutcome = SendResult | 'skipped' | 'failed';

type Deps = {
  /** False without an online session (an offline sign-in has no tokens): nothing is sent. */
  canSync: () => boolean;
  /** Sends the censuses that are ready. Forced, also those waiting after a failed send. */
  sendCensuses: (options: { force: boolean }) => Promise<SendResult>;
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
 *
 * The censuses go first on every trigger, whatever the interval: field data never waits for a
 * download. They have a queue of their own, so the census taker can send while a map downloads.
 */
export function createSyncEngine({
  canSync,
  sendCensuses,
  pullCatalogs,
  pullMaps,
  catalogsSyncedAt,
  minIntervalMs,
  now = Date.now,
}: Deps) {
  let running: Promise<SyncOutcome> | null = null;
  let sending: Promise<unknown> = Promise.resolve();

  /** One send at a time: each waits for the one before, so no census is sent twice at once. */
  function sendNow({ force = false }: SyncOptions = {}): Promise<SendOutcome> {
    if (!canSync()) return Promise.resolve('skipped');
    const send = sending.then(() => sendCensuses({ force })).catch((): SendOutcome => 'failed');
    sending = send;
    return send;
  }

  async function run(force: boolean): Promise<SyncOutcome> {
    try {
      // A failed send does not stop the downloads: they do not depend on it.
      await sendNow({ force });
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

  return { syncNow, sendNow };
}

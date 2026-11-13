import { and, asc, eq } from 'drizzle-orm';

import { getDatabase } from '../db/client';
import { censuses } from '../db/schema';
import type { OutboxStore } from './outbox.sender';

type Change = Partial<typeof censuses.$inferInsert>;

/** Only a census that is ready changes: an answer never overwrites one that came before it. */
async function update(id: string, at: number, change: Change): Promise<void> {
  await getDatabase()
    .update(censuses)
    .set({ ...change, updatedAt: new Date(at) })
    .where(and(eq(censuses.id, id), eq(censuses.status, 'ready')));
}

/** The censuses to send, in SQLite. */
export const outboxStore: OutboxStore = {
  async ready(userId) {
    const rows = await getDatabase()
      .select({
        id: censuses.id,
        payload: censuses.payload,
        attempts: censuses.attempts,
        nextAttemptAt: censuses.nextAttemptAt,
      })
      .from(censuses)
      .where(and(eq(censuses.userId, userId), eq(censuses.status, 'ready')))
      // UUID v7: the order of the ids is the order the censuses were taken in.
      .orderBy(asc(censuses.id));

    return rows.map((row) => ({ ...row, nextAttemptAt: row.nextAttemptAt?.getTime() ?? null }));
  },

  markSent: (id, censusId, at) =>
    update(id, at, { status: 'sent', censusId, sentAt: new Date(at), nextAttemptAt: null }),

  markInReview: (id, conflict, at) =>
    update(id, at, { status: 'in_review', conflict, sentAt: new Date(at), nextAttemptAt: null }),

  markNeedsFix: (id, errors, at) =>
    update(id, at, { status: 'needs_fix', errors, nextAttemptAt: null }),

  markAnomaly: (id, at) => update(id, at, { status: 'anomaly', nextAttemptAt: null }),

  markFailed: (id, attempts, nextAttemptAt, at) =>
    update(id, at, { attempts, nextAttemptAt: new Date(nextAttemptAt) }),
};

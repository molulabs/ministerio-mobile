import { and, count, desc, eq, inArray, ne } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { uuidv7 } from '@/src/infrastructure/crypto/uuid';
import { getDatabase } from '@/src/infrastructure/db/client';
import { censuses, type CensusStatus } from '@/src/infrastructure/db/schema';

import { SCHEMA_VERSION } from './form/censusForm.model';
import { type CensusListItem, toListItem } from './list/censusList';

/** Saves a finished census of the user, ready for the sync engine to send. Returns its id. */
export async function saveReadyCensus(
  userId: number,
  payload: Record<string, unknown>,
): Promise<string> {
  const id = uuidv7();
  const now = new Date();
  await getDatabase()
    .insert(censuses)
    .values({
      id,
      userId,
      schemaVersion: SCHEMA_VERSION,
      payload: { ...payload, schemaVersion: SCHEMA_VERSION },
      status: 'ready',
      createdAt: now,
      updatedAt: now,
    });
  return id;
}

/** The user's censuses, newest first, kept up to date: a send that changes one re-renders. */
export function useCensuses(userId: number): CensusListItem[] {
  const { data } = useLiveQuery(
    getDatabase()
      .select({
        id: censuses.id,
        status: censuses.status,
        payload: censuses.payload,
        errors: censuses.errors,
        conflict: censuses.conflict,
      })
      .from(censuses)
      .where(and(eq(censuses.userId, userId), ne(censuses.status, 'draft')))
      // UUID v7: the newest census has the highest id.
      .orderBy(desc(censuses.id)),
    [userId],
  );
  return data.flatMap((row) => toListItem(row) ?? []);
}

/**
 * What has not reached the API yet and still can: the drafts, the ready to send and the ones to
 * fix. A census the API refused (anomaly) is not counted: the phone can do nothing more with it.
 */
const UNSENT: CensusStatus[] = ['draft', 'ready', 'needs_fix'];

/** How many of the user's censuses have not gone out, kept up to date. */
export function useUnsentCount(userId: number): number {
  const { data } = useLiveQuery(
    getDatabase()
      .select({ unsent: count() })
      .from(censuses)
      .where(and(eq(censuses.userId, userId), inArray(censuses.status, UNSENT))),
    [userId],
  );
  return data[0]?.unsent ?? 0;
}

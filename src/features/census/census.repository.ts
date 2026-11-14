import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { uuidv7 } from '@/src/infrastructure/crypto/uuid';
import { getDatabase } from '@/src/infrastructure/db/client';
import { censuses, type CensusStatus } from '@/src/infrastructure/db/schema';

import { type CensusPayload, SCHEMA_VERSION } from './form/censusForm.model';
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
      .where(eq(censuses.userId, userId))
      // UUID v7: the newest census has the highest id.
      .orderBy(desc(censuses.id)),
    [userId],
  );
  return data.map(toListItem);
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

/** Only a draft changes here: a finished census belongs to the outbox, and a sent one never changes. */
const draftOf = (id: string, userId: number) =>
  and(eq(censuses.id, id), eq(censuses.userId, userId), eq(censuses.status, 'draft'));

/** Starts a census of the user, on the first step. Returns its id. */
export async function createDraft(userId: number, payload: CensusPayload): Promise<string> {
  const id = uuidv7();
  const now = new Date();
  await getDatabase().insert(censuses).values({
    id,
    userId,
    schemaVersion: SCHEMA_VERSION,
    payload,
    status: 'draft',
    formStep: 0,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export type Draft = { payload: Record<string, unknown>; formStep: number | null };

/** One of the user's drafts, or null when it is not a draft of theirs (finished, discarded, another user's). */
export async function getDraft(id: string, userId: number): Promise<Draft | null> {
  const rows = await getDatabase()
    .select({ payload: censuses.payload, formStep: censuses.formStep })
    .from(censuses)
    .where(draftOf(id, userId));
  return rows[0] ?? null;
}

/** Keeps what the wizard has and the step it is on, so nothing is lost if Android closes the app. */
export async function saveDraft(
  id: string,
  userId: number,
  payload: CensusPayload,
  formStep: number,
): Promise<void> {
  await getDatabase()
    .update(censuses)
    .set({ payload, formStep, schemaVersion: SCHEMA_VERSION, updatedAt: new Date() })
    .where(draftOf(id, userId));
}

/** The census is done: the outbox sends it from now on, as it is. */
export async function finishDraft(
  id: string,
  userId: number,
  payload: CensusPayload,
): Promise<void> {
  await getDatabase()
    .update(censuses)
    .set({
      payload,
      schemaVersion: SCHEMA_VERSION,
      status: 'ready',
      formStep: null,
      updatedAt: new Date(),
    })
    .where(draftOf(id, userId));
}

/** Deletes a draft the user chose to throw away. Never anything else: field data is never lost. */
export async function discardDraft(id: string, userId: number): Promise<void> {
  await getDatabase().delete(censuses).where(draftOf(id, userId));
}

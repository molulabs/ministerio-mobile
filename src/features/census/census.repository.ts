import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { uuidv7 } from '@/src/infrastructure/crypto/uuid';
import { getDatabase } from '@/src/infrastructure/db/client';
import { type CensusFieldError, censuses, type CensusStatus } from '@/src/infrastructure/db/schema';

import { type CensusPayload, SCHEMA_VERSION } from './form/censusForm.model';
import { firstStepToFix } from './form/censusForm.steps';
import { labelOfField } from './form/fieldLabels';
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

export type Draft = {
  payload: Record<string, unknown>;
  formStep: number | null;
  /** What the API rejected, when the draft is a census reopened to fix. */
  errors: CensusFieldError[] | null;
};

/** One of the user's drafts, or null when it is not a draft of theirs (finished, discarded, another user's). */
export async function getDraft(id: string, userId: number): Promise<Draft | null> {
  const rows = await getDatabase()
    .select({ payload: censuses.payload, formStep: censuses.formStep, errors: censuses.errors })
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
      // What the API said was of the census as it was: this one goes as fixed.
      errors: null,
      updatedAt: new Date(),
    })
    .where(draftOf(id, userId));
}

/**
 * Turns a census the API rejected (needs_fix) into a draft to fix on the phone, opened on the
 * first step with an error. The draft gets a new id, so the fixed census is a new PUT: an id the
 * API has seen never goes with another body. Copying it and deleting the rejected one happen in
 * one transaction, so the census is always on the phone once. Returns the draft's id, or null
 * when there is no such census of the user (already reopened, or another user's).
 */
export function reopenToFix(id: string, userId: number): string | null {
  return getDatabase().transaction((tx) => {
    const rejected = tx
      .select({ payload: censuses.payload, errors: censuses.errors })
      .from(censuses)
      .where(
        and(eq(censuses.id, id), eq(censuses.userId, userId), eq(censuses.status, 'needs_fix')),
      )
      .get();
    if (!rejected) return null;

    // Named now, against the payload the API rejected: fixing the draft may move the rows of a
    // list ("forestSpecies[1]"), and the name says which one the API meant.
    const errors = (rejected.errors ?? []).map((error) => ({
      ...error,
      label: labelOfField(error.field, rejected.payload),
    }));
    const draftId = uuidv7();
    const now = new Date();
    tx.insert(censuses)
      .values({
        id: draftId,
        userId,
        schemaVersion: SCHEMA_VERSION,
        payload: rejected.payload,
        errors,
        status: 'draft',
        formStep: firstStepToFix(errors),
        createdAt: now,
        updatedAt: now,
      })
      .run();
    tx.delete(censuses).where(eq(censuses.id, id)).run();
    return draftId;
  });
}

/** Deletes a draft the user chose to throw away. Never anything else: field data is never lost. */
export async function discardDraft(id: string, userId: number): Promise<void> {
  await getDatabase().delete(censuses).where(draftOf(id, userId));
}

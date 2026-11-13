import { getDatabase } from '@/src/infrastructure/db/client';
import { censuses } from '@/src/infrastructure/db/schema';
import { uuidv7 } from '@/src/infrastructure/crypto/uuid';

/** The payload version the API reads (CensusSubmissionService::SCHEMA_VERSION). */
export const SCHEMA_VERSION = 2;

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

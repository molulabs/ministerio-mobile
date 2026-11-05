import { useSession } from '@/src/features/auth/session.store';
import { openDatabase } from '@/src/infrastructure/db/client';

import { startSync } from './sync';

/**
 * Start-up, in order: the database (open + migrations), the saved session, then the sync
 * engine. Navigation is shown only after the first two, so no screen ever reads a database that
 * is not migrated yet.
 */
export async function bootstrap(): Promise<void> {
  await openDatabase();
  await useSession.getState().restore();
  startSync();
}

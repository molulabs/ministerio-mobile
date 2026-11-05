import { useSession } from '@/src/features/auth/session.store';
import { openDatabase } from '@/src/infrastructure/db/client';

/**
 * Start-up, in order: the database (open + migrations), then the saved session. Navigation is
 * shown only after both, so no screen ever reads a database that is not migrated yet.
 */
export async function bootstrap(): Promise<void> {
  await openDatabase();
  await useSession.getState().restore();
}

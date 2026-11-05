import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseAsync } from 'expo-sqlite';

import { randomHex } from '../crypto/pbkdf2';
import { secureStore } from '../storage/secureStore';
import migrations from './migrations/migrations';
import * as schema from './schema';

const DATABASE_NAME = 'censo.db';
const KEY_STORE_KEY = 'db.encryptionKey';

export type AppDatabase = ExpoSQLiteDatabase<typeof schema>;

let database: AppDatabase | null = null;

/**
 * The SQLCipher key: 32 random bytes kept in SecureStore (Android Keystore). Created once, before
 * the database file exists. Never replaced: a new key would make the existing file unreadable.
 */
async function encryptionKey(): Promise<string> {
  const saved = await secureStore.get(KEY_STORE_KEY);
  if (saved) return saved;
  const key = randomHex(32);
  await secureStore.set(KEY_STORE_KEY, key);
  return key;
}

/**
 * Opens the encrypted database and brings its schema up to date. Called once at start-up,
 * before any screen. Throws if the file cannot be opened with the key or a migration fails:
 * the app must not go on with a half-migrated database, and it never deletes the file.
 */
export async function openDatabase(): Promise<AppDatabase> {
  if (database) return database;

  const key = await encryptionKey();
  // enableChangeListener lets useLiveQuery re-run when a table changes.
  const sqlite = await openDatabaseAsync(DATABASE_NAME, { enableChangeListener: true });
  // The key must be the first statement on the connection. Raw key: no passphrase derivation.
  await sqlite.execAsync(`PRAGMA key = "x'${key}'"`);
  // Fails here, with a clear error, when the key does not match the file.
  await sqlite.execAsync('SELECT count(*) FROM sqlite_master');

  const db = drizzle(sqlite, { schema });
  await migrate(db, migrations);
  database = db;
  return db;
}

/** The open database. Only valid after openDatabase() resolved (start-up guarantees it). */
export function getDatabase(): AppDatabase {
  if (!database) {
    throw new Error('The database is not open yet: openDatabase() runs at start-up');
  }
  return database;
}

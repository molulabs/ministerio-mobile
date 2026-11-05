import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Small values the sync engine keeps between runs: the catalogs ETag, when the last sync
 * finished. One row per key.
 */
export const syncState = sqliteTable('sync_state', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

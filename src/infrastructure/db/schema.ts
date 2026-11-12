import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Small values the sync engine keeps between runs: the catalogs ETag, when the last sync
 * finished. One row per key.
 */
export const syncState = sqliteTable('sync_state', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

/*
 * Catalogs: copies of the API's lists the census form picks from. Only the catalogs puller
 * writes them, replacing each table whole; the ids are the API's.
 */

export const localities = sqliteTable(
  'localities',
  {
    id: integer('id').primaryKey(),
    /** The API's Department enum value, e.g. DOCTOR_MANUEL_BELGRANO. */
    department: text('department').notNull(),
    name: text('name').notNull(),
  },
  (table) => [index('localities_department_idx').on(table.department)],
);

export const livestockBreeds = sqliteTable(
  'livestock_breeds',
  {
    id: integer('id').primaryKey(),
    /** The API's LivestockSpecies enum value. */
    species: text('species').notNull(),
    name: text('name').notNull(),
  },
  (table) => [index('livestock_breeds_species_idx').on(table.species)],
);

export const forestSpecies = sqliteTable('forest_species', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
});

/** Producers already registered: only enough to warn about a duplicate, not their data. */
export const producerIndex = sqliteTable('producer_index', {
  documentNumber: text('document_number').primaryKey(),
  fullName: text('full_name').notNull(),
});

/*
 * Offline map: the packages installed on the phone, all complete and checked. Only the maps
 * puller writes it, replacing the table whole once every file of the manifest is in place.
 */
export const mapPackages = sqliteTable('map_packages', {
  id: text('id').primaryKey(),
  /** raster, vector or style. */
  kind: text('kind').notNull(),
  version: text('version').notNull(),
  /** Name in the maps directory: the .pmtiles file, or the directory the style was unzipped to. */
  name: text('name').notNull(),
  /** west, south, east, north (tile packages). */
  bounds: text('bounds', { mode: 'json' }).$type<[number, number, number, number]>(),
  minzoom: integer('minzoom'),
  maxzoom: integer('maxzoom'),
  /** Shown on the map, as the licence of the data asks. */
  attribution: text('attribution'),
  /** Ids of the packages the style reads (style only). */
  requires: text('requires', { mode: 'json' }).$type<string[]>(),
  installedAt: integer('installed_at', { mode: 'timestamp_ms' }).notNull(),
});

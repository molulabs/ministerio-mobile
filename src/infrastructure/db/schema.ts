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

/*
 * Censuses taken on this phone: the drafts and the outbox are the same rows, told apart by the
 * status. Field data is never lost: a row is deleted only by its census taker, while a draft.
 */

/**
 * - draft: being filled in; saved at every step of the form.
 * - ready: finished, waiting to be sent.
 * - sent: the API made a census of it (201 ACCEPTED).
 * - in_review: the API kept it for an operator to sort out (202 CONFLICT); nothing to fix here.
 * - needs_fix: the API rejected it (422); `errors` says which fields.
 * - anomaly: the API has another census under this id (409); never sent again.
 */
export type CensusStatus = 'draft' | 'ready' | 'sent' | 'in_review' | 'needs_fix' | 'anomaly';

/** One error of a 422, as the API gives it: the field is a path, as "livestock.cattleCowsOwn". */
export type CensusFieldError = {
  /** Where the API found it, as it names it: "productionUnit.totalHectares". */
  field: string;
  message: string;
  /** What the form calls the field, when the phone knows it: "Hectáreas totales". */
  label?: string | null;
};

export const censuses = sqliteTable(
  'censuses',
  {
    /** UUID v7 made on the phone: the id of the PUT, so sending it twice gives one census. */
    id: text('id').primaryKey(),
    /** The API id of the census taker. A census is only ever sent with this user's token. */
    userId: integer('user_id').notNull(),
    /** The shape of the payload; the API rejects a version it does not read. */
    schemaVersion: integer('schema_version').notNull(),
    /**
     * The body of the PUT. Once sent it must not change: the API answers a second PUT with the
     * first answer only when the payload is the same, and with a 409 otherwise.
     */
    payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
    status: text('status').$type<CensusStatus>().notNull(),
    /** Why the API rejected it (needs_fix). */
    errors: text('errors', { mode: 'json' }).$type<CensusFieldError[]>(),
    /** What the operator has to sort out (in_review), as the API words it. */
    conflict: text('conflict'),
    /** The id of the census the API made of it (sent). */
    censusId: integer('census_id'),
    /** Sends that failed for the network or the server, and when to try again (ready). */
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: integer('next_attempt_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    /** When the API answered 201 or 202. */
    sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
    /** The wizard step a draft was left on, to open it there again (draft). */
    formStep: integer('form_step'),
  },
  (table) => [index('censuses_user_status_idx').on(table.userId, table.status)],
);

import { asc, eq, or, type SQL, sql, type SQLWrapper } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { getDatabase } from '@/src/infrastructure/db/client';
import {
  forestSpecies,
  livestockBreeds,
  localities,
  producerIndex,
} from '@/src/infrastructure/db/schema';

/** How many producers a search shows: enough to pick from, few enough to read. */
const PRODUCER_RESULTS = 30;

export type IndexedProducer = { documentNumber: string; fullName: string };
export type Locality = { id: number; name: string };
export type Breed = { id: number; name: string };
export type ForestSpecies = { id: number; name: string };

/** The column has the text anywhere, with LIKE's own wildcards (% and _) taken as plain characters. */
const contains = (column: SQLWrapper, text: string): SQL =>
  sql`${column} LIKE ${`%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`} ESCAPE '\\'`;

/**
 * The registered producers whose document has the digits typed, or whose name has the text: the
 * phone's copy of the producers, so it works without signal.
 */
export async function searchProducers(text: string): Promise<IndexedProducer[]> {
  const digits = text.replace(/\D/g, '');
  const name = text.trim();
  const matches = [
    ...(digits ? [contains(producerIndex.documentNumber, digits)] : []),
    ...(/[^\d.\-\s]/.test(name) ? [contains(producerIndex.fullName, name)] : []),
  ];
  if (matches.length === 0) return [];
  return getDatabase()
    .select({ documentNumber: producerIndex.documentNumber, fullName: producerIndex.fullName })
    .from(producerIndex)
    .where(or(...matches))
    .orderBy(asc(producerIndex.fullName))
    .limit(PRODUCER_RESULTS);
}

/** Whether a producer with this document is registered, as far as the phone knows. */
export function useIsRegisteredProducer(documentNumber: string): boolean {
  const { data } = useLiveQuery(
    getDatabase()
      .select({ documentNumber: producerIndex.documentNumber })
      .from(producerIndex)
      .where(eq(producerIndex.documentNumber, documentNumber))
      .limit(1),
    [documentNumber],
  );
  return documentNumber !== '' && data.length > 0;
}

/** The localities of a department, by name; none without a department. */
export function useLocalities(department: string): Locality[] {
  const { data } = useLiveQuery(
    getDatabase()
      .select({ id: localities.id, name: localities.name })
      .from(localities)
      .where(eq(localities.department, department))
      .orderBy(asc(localities.name)),
    [department],
  );
  return department === '' ? [] : data;
}

/** The breeds of a species (the API's LivestockSpecies), by name. */
export function useBreeds(species: string): Breed[] {
  const { data } = useLiveQuery(
    getDatabase()
      .select({ id: livestockBreeds.id, name: livestockBreeds.name })
      .from(livestockBreeds)
      .where(eq(livestockBreeds.species, species))
      .orderBy(asc(livestockBreeds.name)),
    [species],
  );
  return data;
}

/** The forest species on the phone, by name. */
export function useForestSpecies(): ForestSpecies[] {
  const { data } = useLiveQuery(
    getDatabase()
      .select({ id: forestSpecies.id, name: forestSpecies.name })
      .from(forestSpecies)
      .orderBy(asc(forestSpecies.name)),
  );
  return data;
}

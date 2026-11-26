import { asc, eq, or, type SQL, sql, type SQLWrapper } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { getDatabase } from '@/src/infrastructure/db/client';
import {
  forestSpecies,
  livestockBreeds,
  localities,
  municipalities,
  producerFarms,
  producerIndex,
} from '@/src/infrastructure/db/schema';

/** How many producers a search shows: enough to pick from, few enough to read. */
const PRODUCER_RESULTS = 30;

export type IndexedProducer = { documentNumber: string; fullName: string };
/** A farm of a registered producer, from the catalogs. */
export type ProducerFarm = {
  id: number;
  number: number;
  label: string;
  renspa: string | null;
  producerLivesOnFarm: boolean | null;
};
/** municipalityId is null while the catalog does not say which municipality it is in. */
export type Locality = { id: number; name: string; municipalityId: number | null };
export type Municipality = { id: number; name: string };
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

/** The registered producer with this document, as far as the phone knows; null if none. */
export function useRegisteredProducer(documentNumber: string): IndexedProducer | null {
  const { data } = useLiveQuery(
    getDatabase()
      .select({ documentNumber: producerIndex.documentNumber, fullName: producerIndex.fullName })
      .from(producerIndex)
      .where(eq(producerIndex.documentNumber, documentNumber))
      .limit(1),
    [documentNumber],
  );
  return documentNumber !== '' ? (data[0] ?? null) : null;
}

/** The farms of the registered producer with this document, by number; none for a new one. */
export function useProducerFarms(documentNumber: string): ProducerFarm[] {
  const { data } = useLiveQuery(
    getDatabase()
      .select({
        id: producerFarms.id,
        number: producerFarms.number,
        label: producerFarms.label,
        renspa: producerFarms.renspa,
        producerLivesOnFarm: producerFarms.producerLivesOnFarm,
      })
      .from(producerFarms)
      .where(eq(producerFarms.documentNumber, documentNumber))
      .orderBy(asc(producerFarms.number)),
    [documentNumber],
  );
  return documentNumber !== '' ? data : [];
}

/** The municipalities of a department, by name; none without a department. */
export function useMunicipalities(department: string): Municipality[] {
  const { data } = useLiveQuery(
    getDatabase()
      .select({ id: municipalities.id, name: municipalities.name })
      .from(municipalities)
      .where(eq(municipalities.department, department))
      .orderBy(asc(municipalities.name)),
    [department],
  );
  return department === '' ? [] : data;
}

/** The localities of a department, by name; none without a department. */
export function useLocalities(department: string): Locality[] {
  const { data } = useLiveQuery(
    getDatabase()
      .select({
        id: localities.id,
        name: localities.name,
        municipalityId: localities.municipalityId,
      })
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

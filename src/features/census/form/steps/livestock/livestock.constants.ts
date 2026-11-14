import type { BreedKey, CountKey, TextKey, YesNoKey } from './livestock.helper';

/** A kind of animal of a species, counted as own and of third parties (the web's SpeciesRowConfig). */
export type SpeciesRow = {
  label: string;
  ownKey: CountKey;
  thirdPartyKey: CountKey;
  /** Breeds picked from the species' catalog, shown under the counts. */
  breeds?: { key: BreedKey; species: string };
  detail?: { key: TextKey; label: string };
};

export const CATTLE_ROWS: SpeciesRow[] = [
  { label: 'Vacas', ownKey: 'cattleCowsOwn', thirdPartyKey: 'cattleCowsThirdParty' },
  { label: 'Toros', ownKey: 'cattleBullsOwn', thirdPartyKey: 'cattleBullsThirdParty' },
  { label: 'Novillos', ownKey: 'cattleSteersOwn', thirdPartyKey: 'cattleSteersThirdParty' },
  { label: 'Vaquillonas', ownKey: 'cattleHeifersOwn', thirdPartyKey: 'cattleHeifersThirdParty' },
  { label: 'Terneros', ownKey: 'cattleCalvesOwn', thirdPartyKey: 'cattleCalvesThirdParty' },
];

export const SHEEP_ROWS: SpeciesRow[] = [
  { label: 'Carneros', ownKey: 'sheepRamsOwn', thirdPartyKey: 'sheepRamsThirdParty' },
  { label: 'Ovejas', ownKey: 'sheepEwesOwn', thirdPartyKey: 'sheepEwesThirdParty' },
  { label: 'Corderos', ownKey: 'sheepLambsOwn', thirdPartyKey: 'sheepLambsThirdParty' },
  {
    label: 'Corderos/as > 1 año',
    ownKey: 'sheepLambsOver1yOwn',
    thirdPartyKey: 'sheepLambsOver1yThirdParty',
  },
];

export const GOAT_ROWS: SpeciesRow[] = [
  { label: 'Chivos / chivatos', ownKey: 'goatKidsOwn', thirdPartyKey: 'goatKidsThirdParty' },
  { label: 'Cabras', ownKey: 'goatDoesOwn', thirdPartyKey: 'goatDoesThirdParty' },
  { label: 'Capones', ownKey: 'goatWethersOwn', thirdPartyKey: 'goatWethersThirdParty' },
  {
    label: 'Cabritos/as > 1 año',
    ownKey: 'goatKidsOver1yOwn',
    thirdPartyKey: 'goatKidsOver1yThirdParty',
  },
];

export const LLAMA_ROWS: SpeciesRow[] = [
  {
    label: 'Reproductor / añacho',
    ownKey: 'llamaBreedingMalesOwn',
    thirdPartyKey: 'llamaBreedingMalesThirdParty',
  },
  { label: 'Llamas hembras', ownKey: 'llamaFemalesOwn', thirdPartyKey: 'llamaFemalesThirdParty' },
  { label: 'Capones', ownKey: 'llamaGeldingsOwn', thirdPartyKey: 'llamaGeldingsThirdParty' },
  { label: 'Tekes', ownKey: 'llamaTekesOwn', thirdPartyKey: 'llamaTekesThirdParty' },
  {
    label: 'Sin discriminar',
    ownKey: 'llamaUnclassifiedOwn',
    thirdPartyKey: 'llamaUnclassifiedThirdParty',
  },
];

export const PIG_ROWS: SpeciesRow[] = [
  { label: 'Reproductor', ownKey: 'pigBreedingOwn', thirdPartyKey: 'pigBreedingThirdParty' },
  { label: 'Cerdas', ownKey: 'pigSowsOwn', thirdPartyKey: 'pigSowsThirdParty' },
  { label: 'Maltones', ownKey: 'pigWeanersOwn', thirdPartyKey: 'pigWeanersThirdParty' },
  { label: 'Lechones', ownKey: 'pigPigletsOwn', thirdPartyKey: 'pigPigletsThirdParty' },
];

export const EQUINE_ROWS: SpeciesRow[] = [
  {
    label: 'Equino',
    ownKey: 'horsesOwn',
    thirdPartyKey: 'horsesThirdParty',
    breeds: { key: 'horseBreeds', species: 'EQUINE' },
  },
  {
    label: 'Asnal',
    ownKey: 'donkeysOwn',
    thirdPartyKey: 'donkeysThirdParty',
    breeds: { key: 'donkeyBreeds', species: 'DONKEY' },
  },
  {
    label: 'Otros',
    ownKey: 'equineOtherOwn',
    thirdPartyKey: 'equineOtherThirdParty',
    detail: { key: 'equineOtherDetail', label: 'Detalle' },
  },
];

export const POULTRY_FIELDS: { key: CountKey; label: string }[] = [
  { key: 'poultryBroilers', label: 'Pollos parrilleros' },
  { key: 'poultryLayingHens', label: 'Gallinas ponedoras' },
  { key: 'poultryTurkeys', label: 'Pavos' },
  { key: 'poultryDucks', label: 'Patos' },
  { key: 'poultryOther', label: 'Otros (aves)' },
];

export const SHEEP_ORIENTATION_OPTIONS = [
  { label: 'Carne', value: 'carne' },
  { label: 'Cuero', value: 'cuero' },
  { label: 'Leche', value: 'leche' },
  { label: 'Lana', value: 'lana' },
  { label: 'Cabaña', value: 'cabana' },
];

export const GOAT_PRACTICES: { key: YesNoKey; label: string }[] = [
  { key: 'goatExternalDeworming', label: 'Desparasitaciones externas' },
  { key: 'goatInternalDeworming', label: 'Desparasitaciones internas' },
  { key: 'goatMandatoryVaccines', label: 'Vacunas obligatorias' },
  { key: 'goatOptionalVaccines', label: 'Vacunas no obligatorias' },
];

export const LLAMA_PRACTICES: { key: YesNoKey; label: string }[] = [
  { key: 'llamaRotationalGrazing', label: 'Pastoreo rotativo intensivo' },
  { key: 'llamaFeedSupplement', label: 'Suplemento alimentario' },
  { key: 'llamaBreedingSeason', label: 'Estacionamiento de servicios' },
];

/** A species of the step: its rows, and what is asked of it besides them. */
export type Species = {
  title: string;
  question: string;
  hasKey: YesNoKey;
  rows: SpeciesRow[];
  /** For the totals, "bovinos"; a species without totals has none. */
  name?: string;
  breeds?: { key: BreedKey; species: string };
  declaredKey?: CountKey;
  practices?: { key: YesNoKey; label: string }[];
};

export const CATTLE: Species = {
  title: 'Bovinos',
  question: '¿Posee bovinos?',
  hasKey: 'hasCattle',
  rows: CATTLE_ROWS,
  name: 'bovinos',
  breeds: { key: 'cattleBreeds', species: 'CATTLE' },
  declaredKey: 'cattleDeclaredTotal',
};

export const SHEEP: Species = {
  title: 'Ovinos',
  question: '¿Posee ovinos?',
  hasKey: 'hasSheep',
  rows: SHEEP_ROWS,
  name: 'ovinos',
  breeds: { key: 'sheepBreeds', species: 'SHEEP' },
  declaredKey: 'sheepDeclaredTotal',
};

export const GOATS: Species = {
  title: 'Caprinos',
  question: '¿Posee caprinos?',
  hasKey: 'hasGoats',
  rows: GOAT_ROWS,
  name: 'caprinos',
  breeds: { key: 'goatBreeds', species: 'GOAT' },
  declaredKey: 'goatDeclaredTotal',
  practices: GOAT_PRACTICES,
};

export const LLAMAS: Species = {
  title: 'Llamas',
  question: '¿Posee llamas?',
  hasKey: 'hasLlamas',
  rows: LLAMA_ROWS,
  name: 'llamas',
  declaredKey: 'llamaDeclaredTotal',
  practices: LLAMA_PRACTICES,
};

export const PIGS: Species = {
  title: 'Porcinos',
  question: '¿Posee porcinos?',
  hasKey: 'hasPigs',
  rows: PIG_ROWS,
  name: 'porcinos',
  breeds: { key: 'pigBreeds', species: 'PIG' },
  declaredKey: 'pigDeclaredTotal',
};

export const EQUINES: Species = {
  title: 'Equinos y asnales',
  question: '¿Posee equinos o asnales?',
  hasKey: 'hasEquines',
  rows: EQUINE_ROWS,
};

/** Every species asked with rows, in the step's order (poultry is asked apart). */
export const SPECIES: Species[] = [CATTLE, SHEEP, GOATS, LLAMAS, PIGS, EQUINES];

/** The keys of the counts each total adds up. */
export const keysOf = (rows: SpeciesRow[]): CountKey[] =>
  rows.flatMap((row) => [row.ownKey, row.thirdPartyKey]);

/** The step's texts, the web's. */
export const LIVESTOCK_TEXTS = {
  hasActivity: '¿Registra actividad pecuaria?',
  own: 'Propios',
  thirdParty: 'De terceros',
  breeds: 'Razas',
  breedsPlaceholder: 'Buscar raza…',
  breedsEmpty: 'Sin coincidencias',
  createBreed: (text: string) => `Agregar raza «${text}»`,
  newBreeds: 'Las razas nuevas se agregan al enviar el censo.',
  total: (species: string, total: number) => `Total ${species} (calculado): ${total}`,
  declaredTotal: (species: string) => `Total declarado en el papel (${species})`,
  declaredTotalWarning: 'El total del papel no coincide con la suma',
  poultryOtherDetail: 'Detalle de "otros" (aves)',
  poultry: 'Aves de corral',
  hasPoultry: '¿Posee aves de corral?',
  sheepOrientation: 'Orientación productiva',
  otherCamelids: 'Otros camélidos',
};

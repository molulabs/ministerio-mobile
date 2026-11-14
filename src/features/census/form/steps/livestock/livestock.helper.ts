import {
  asText,
  type CatalogRef,
  textOrNull,
  toCatalogRefs,
  toCount,
} from '../../fields/fields.helper';

/** The counts of animals, typed as text (the web's LivestockValues string fields but the details). */
export const COUNT_KEYS = [
  'cattleCowsOwn',
  'cattleCowsThirdParty',
  'cattleBullsOwn',
  'cattleBullsThirdParty',
  'cattleSteersOwn',
  'cattleSteersThirdParty',
  'cattleHeifersOwn',
  'cattleHeifersThirdParty',
  'cattleCalvesOwn',
  'cattleCalvesThirdParty',
  'cattleDeclaredTotal',
  'poultryBroilers',
  'poultryLayingHens',
  'poultryTurkeys',
  'poultryDucks',
  'poultryOther',
  'sheepRamsOwn',
  'sheepRamsThirdParty',
  'sheepEwesOwn',
  'sheepEwesThirdParty',
  'sheepLambsOwn',
  'sheepLambsThirdParty',
  'sheepLambsOver1yOwn',
  'sheepLambsOver1yThirdParty',
  'sheepDeclaredTotal',
  'goatKidsOwn',
  'goatKidsThirdParty',
  'goatDoesOwn',
  'goatDoesThirdParty',
  'goatWethersOwn',
  'goatWethersThirdParty',
  'goatKidsOver1yOwn',
  'goatKidsOver1yThirdParty',
  'goatDeclaredTotal',
  'llamaBreedingMalesOwn',
  'llamaBreedingMalesThirdParty',
  'llamaFemalesOwn',
  'llamaFemalesThirdParty',
  'llamaGeldingsOwn',
  'llamaGeldingsThirdParty',
  'llamaTekesOwn',
  'llamaTekesThirdParty',
  'llamaUnclassifiedOwn',
  'llamaUnclassifiedThirdParty',
  'llamaDeclaredTotal',
  'pigBreedingOwn',
  'pigBreedingThirdParty',
  'pigSowsOwn',
  'pigSowsThirdParty',
  'pigWeanersOwn',
  'pigWeanersThirdParty',
  'pigPigletsOwn',
  'pigPigletsThirdParty',
  'pigDeclaredTotal',
  'horsesOwn',
  'horsesThirdParty',
  'donkeysOwn',
  'donkeysThirdParty',
  'equineOtherOwn',
  'equineOtherThirdParty',
] as const;

/** The free texts. */
export const TEXT_KEYS = [
  'poultryOtherDetail',
  'llamaOtherCamelidsDetail',
  'equineOtherDetail',
] as const;

/** The Sí/No questions. */
export const YES_NO_KEYS = [
  'hasLivestockActivity',
  'hasCattle',
  'hasPoultry',
  'hasSheep',
  'hasGoats',
  'hasLlamas',
  'hasPigs',
  'hasEquines',
  'goatExternalDeworming',
  'goatInternalDeworming',
  'goatMandatoryVaccines',
  'goatOptionalVaccines',
  'llamaRotationalGrazing',
  'llamaFeedSupplement',
  'llamaBreedingSeason',
] as const;

/** The breeds picked of each species, and where the payload keeps them (the web's toLivestockPayload). */
export const BREED_KEYS = {
  cattleBreeds: 'cattleBreedIds',
  sheepBreeds: 'sheepBreedIds',
  goatBreeds: 'goatBreedIds',
  pigBreeds: 'pigBreedIds',
  horseBreeds: 'horseBreedIds',
  donkeyBreeds: 'donkeyBreedIds',
} as const;

export type CountKey = (typeof COUNT_KEYS)[number];
export type TextKey = (typeof TEXT_KEYS)[number];
export type YesNoKey = (typeof YES_NO_KEYS)[number];
export type BreedKey = keyof typeof BREED_KEYS;

/** What the livestock step edits (the web's LivestockValues). Breeds go by id, or by name when new. */
export type LivestockValues = Record<CountKey | TextKey, string> &
  Record<YesNoKey, boolean> &
  Record<BreedKey, CatalogRef[]> & { sheepOrientation: string[] };

const BREED_FIELDS = Object.keys(BREED_KEYS) as BreedKey[];

export const EMPTY_LIVESTOCK: LivestockValues = {
  ...(Object.fromEntries(COUNT_KEYS.map((key) => [key, ''])) as Record<CountKey, string>),
  ...(Object.fromEntries(TEXT_KEYS.map((key) => [key, ''])) as Record<TextKey, string>),
  ...(Object.fromEntries(YES_NO_KEYS.map((key) => [key, false])) as Record<YesNoKey, boolean>),
  ...(Object.fromEntries(BREED_FIELDS.map((key) => [key, [] as CatalogRef[]])) as Record<
    BreedKey,
    CatalogRef[]
  >),
  sheepOrientation: [],
};

/** The livestock section of the payload: the API's LivestockRequest. */
export function toLivestockPayload(values: LivestockValues): Record<string, unknown> {
  return {
    ...Object.fromEntries(COUNT_KEYS.map((key) => [key, toCount(values[key])])),
    ...Object.fromEntries(TEXT_KEYS.map((key) => [key, textOrNull(values[key])])),
    ...Object.fromEntries(YES_NO_KEYS.map((key) => [key, values[key]])),
    ...Object.fromEntries(BREED_FIELDS.map((key) => [BREED_KEYS[key], values[key]])),
    sheepOrientation: values.sheepOrientation.length > 0 ? values.sheepOrientation : null,
  };
}

/** A saved livestock section back into the step. */
export function fromLivestockPayload(section: Record<string, unknown>): LivestockValues {
  const orientation = section.sheepOrientation;
  return {
    ...(Object.fromEntries(COUNT_KEYS.map((key) => [key, asText(section[key])])) as Record<
      CountKey,
      string
    >),
    ...(Object.fromEntries(TEXT_KEYS.map((key) => [key, asText(section[key])])) as Record<
      TextKey,
      string
    >),
    ...(Object.fromEntries(YES_NO_KEYS.map((key) => [key, section[key] === true])) as Record<
      YesNoKey,
      boolean
    >),
    ...(Object.fromEntries(
      BREED_FIELDS.map((key) => [key, toCatalogRefs(section[BREED_KEYS[key]])]),
    ) as Record<BreedKey, CatalogRef[]>),
    sheepOrientation: Array.isArray(orientation)
      ? orientation.filter((item): item is string => typeof item === 'string')
      : [],
  };
}

/** The animals counted under these keys (the web's sum). */
export const sum = (values: LivestockValues, keys: readonly CountKey[]) =>
  keys.reduce((total, key) => total + (toCount(values[key]) ?? 0), 0);

/** The total written on the paper form disagrees with the counts: told, not stopped. */
export const declaredTotalDiffers = (declared: string, total: number) =>
  toCount(declared) !== null && toCount(declared) !== total;

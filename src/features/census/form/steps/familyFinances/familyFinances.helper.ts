import { asText, textOrNull, toCount } from '../../fields/fields.helper';

const COUNT_KEYS = [
  'adultChildren',
  'minorChildren',
  'childrenInSchool',
  'familyWorkers',
  'contractedWorkers',
  'permanentWorkers',
  'seasonalWorkers',
  'dayWorkers',
] as const;

const YES_NO_KEYS = [
  'hasSpouse',
  'spouseWorksOnFarm',
  'isBanked',
  'hasInsurance',
  'receivesSocialSubsidy',
] as const;

const LIST_KEYS = ['technicalAdvisory', 'associativism'] as const;

const TEXT_KEYS = ['technicalAdvisoryOtherDetail', 'associativismOtherDetail'] as const;

export type FamilyCountKey = (typeof COUNT_KEYS)[number];

/** What the family and finances step edits, as typed (the web's FamilyFinancesValues). */
export type FamilyFinancesValues = Record<FamilyCountKey | (typeof TEXT_KEYS)[number], string> &
  Record<(typeof YES_NO_KEYS)[number], boolean> &
  Record<(typeof LIST_KEYS)[number], string[]>;

export const EMPTY_FAMILY_FINANCES = {
  ...Object.fromEntries([...COUNT_KEYS, ...TEXT_KEYS].map((key) => [key, ''])),
  ...Object.fromEntries(YES_NO_KEYS.map((key) => [key, false])),
  ...Object.fromEntries(LIST_KEYS.map((key) => [key, []])),
} as unknown as FamilyFinancesValues;

/** The sum of some counts as typed; what is not a figure counts as none. */
export const sumOf = (values: FamilyFinancesValues, keys: readonly FamilyCountKey[]) =>
  keys.reduce((total, key) => total + (toCount(values[key]) ?? 0), 0);

/** More children in school than children: a warning, as on the web, not a block. */
export const moreChildrenInSchool = (values: FamilyFinancesValues) =>
  (toCount(values.childrenInSchool) ?? 0) > sumOf(values, ['adultChildren', 'minorChildren']);

/** The family and finances section of the payload: the API's FamilyFinancesRequest. */
export function toFamilyFinancesPayload(values: FamilyFinancesValues): Record<string, unknown> {
  return {
    ...Object.fromEntries(COUNT_KEYS.map((key) => [key, toCount(values[key])])),
    ...Object.fromEntries(YES_NO_KEYS.map((key) => [key, values[key]])),
    ...Object.fromEntries(
      LIST_KEYS.map((key) => [key, values[key].length > 0 ? values[key] : null]),
    ),
    ...Object.fromEntries(TEXT_KEYS.map((key) => [key, textOrNull(values[key])])),
  };
}

const strings = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/** A saved family and finances section back into the step. */
export function fromFamilyFinancesPayload(section: Record<string, unknown>): FamilyFinancesValues {
  return {
    ...Object.fromEntries([...COUNT_KEYS, ...TEXT_KEYS].map((key) => [key, asText(section[key])])),
    ...Object.fromEntries(YES_NO_KEYS.map((key) => [key, section[key] === true])),
    ...Object.fromEntries(LIST_KEYS.map((key) => [key, strings(section[key])])),
  } as FamilyFinancesValues;
}

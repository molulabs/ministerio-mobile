import {
  asText,
  type CatalogRef,
  textOrNull,
  toCount,
  toCatalogRef,
  toNumber,
} from '../../fields/fields.helper';
import type { ForestType } from './farmInputs.constants';

/** One forest species planted, as typed. `key` only tells the rows apart on screen. */
export type ForestRow = {
  key: string;
  species: CatalogRef | null;
  type: ForestType | null;
  quantity: string;
  hectares: string;
};

/** What the farm inputs step edits, as typed (the web's FarmInputsValues). */
export type FarmInputsValues = {
  fertilizers: string[];
  fertilizersOtherDetail: string;
  usesInsecticides: boolean;
  insecticidesActiveIngredient: string;
  usesFungicides: boolean;
  fungicidesActiveIngredient: string;
  usesHerbicides: boolean;
  herbicidesActiveIngredient: string;
  usesOtherAgrochemicals: boolean;
  otherAgrochemicalsActiveIngredient: string;
  waterSources: string[];
  forestSpecies: ForestRow[];
};

export const EMPTY_FARM_INPUTS: FarmInputsValues = {
  fertilizers: [],
  fertilizersOtherDetail: '',
  usesInsecticides: false,
  insecticidesActiveIngredient: '',
  usesFungicides: false,
  fungicidesActiveIngredient: '',
  usesHerbicides: false,
  herbicidesActiveIngredient: '',
  usesOtherAgrochemicals: false,
  otherAgrochemicalsActiveIngredient: '',
  waterSources: [],
  forestSpecies: [],
};

const USES_KEYS = [
  'usesInsecticides',
  'usesFungicides',
  'usesHerbicides',
  'usesOtherAgrochemicals',
] as const;

const TEXT_KEYS = [
  'fertilizersOtherDetail',
  'insecticidesActiveIngredient',
  'fungicidesActiveIngredient',
  'herbicidesActiveIngredient',
  'otherAgrochemicalsActiveIngredient',
] as const;

let rowSequence = 0;

/** A new forest row, empty unless told otherwise. */
export const newForestRow = (row: Partial<Omit<ForestRow, 'key'>> = {}): ForestRow => ({
  species: null,
  type: null,
  quantity: '',
  hectares: '',
  ...row,
  key: `forest-${++rowSequence}`,
});

/** A row nothing was typed in: it is left out. */
export const isEmptyRow = (row: ForestRow) =>
  row.species === null &&
  row.type === null &&
  row.quantity.trim() === '' &&
  row.hectares.trim() === '';

/** A row with something typed but no species or no type: the API cannot take it. */
export const isIncompleteRow = (row: ForestRow) =>
  !isEmptyRow(row) && (row.species === null || row.type === null);

/** Whether a forest row would keep the census from being finished. */
export const hasIncompleteForestation = (values: FarmInputsValues) =>
  values.forestSpecies.some(isIncompleteRow);

const listOrNull = (list: string[]) => (list.length > 0 ? list : null);

/** The farm inputs section of the payload: the API's FarmInputsRequest. Empty rows are left out. */
export function toFarmInputsPayload(values: FarmInputsValues): Record<string, unknown> {
  return {
    fertilizers: listOrNull(values.fertilizers),
    waterSources: listOrNull(values.waterSources),
    ...Object.fromEntries(USES_KEYS.map((key) => [key, values[key]])),
    ...Object.fromEntries(TEXT_KEYS.map((key) => [key, textOrNull(values[key])])),
    forestSpecies: values.forestSpecies.flatMap((row) =>
      row.species !== null && row.type !== null
        ? [
            {
              forestSpeciesId: row.species,
              type: row.type,
              quantity: toCount(row.quantity),
              hectares: toNumber(row.hectares),
            },
          ]
        : [],
    ),
  };
}

const strings = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const toForestType = (value: unknown): ForestType | null =>
  value === 'NATIVE' || value === 'PLANTED' ? value : null;

/** A saved farm inputs section back into the step. */
export function fromFarmInputsPayload(section: Record<string, unknown>): FarmInputsValues {
  const rows = Array.isArray(section.forestSpecies) ? section.forestSpecies : [];
  return {
    ...EMPTY_FARM_INPUTS,
    fertilizers: strings(section.fertilizers),
    waterSources: strings(section.waterSources),
    ...Object.fromEntries(USES_KEYS.map((key) => [key, section[key] === true])),
    ...Object.fromEntries(TEXT_KEYS.map((key) => [key, asText(section[key])])),
    forestSpecies: rows
      .filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
      .map((row) =>
        newForestRow({
          species: toCatalogRef(row.forestSpeciesId),
          type: toForestType(row.type),
          quantity: asText(row.quantity),
          hectares: asText(row.hectares),
        }),
      ),
  };
}

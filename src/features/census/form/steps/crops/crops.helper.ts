import { asText, textOrNull, toCount, toNumber } from '../../fields/fields.helper';
import { CROP_CODES, type CropCode } from './crops.constants';

/** What is asked of one crop, as typed. */
export type CropPlotValues = { hectares: string; rows: string; detail: string };

/** What the crops step edits, as typed (the web's CropsValues). */
export type CropsValues = {
  hasCropActivity: boolean;
  hasVegetables: boolean;
  hasAndeanCrops: boolean;
  hasCereals: boolean;
  hasIndustrialCrops: boolean;
  hasFruitTrees: boolean;
  hasFlowers: boolean;
  hasAromatics: boolean;
  hasNurseries: boolean;
  nurseryQuantity: string;
  nurseryDetail: string;
  plots: Record<CropCode, CropPlotValues>;
};

const EMPTY_PLOT: CropPlotValues = { hectares: '', rows: '', detail: '' };

export const EMPTY_CROPS: CropsValues = {
  hasCropActivity: false,
  hasVegetables: false,
  hasAndeanCrops: false,
  hasCereals: false,
  hasIndustrialCrops: false,
  hasFruitTrees: false,
  hasFlowers: false,
  hasAromatics: false,
  hasNurseries: false,
  nurseryQuantity: '',
  nurseryDetail: '',
  plots: Object.fromEntries(CROP_CODES.map((code) => [code, EMPTY_PLOT])) as Record<
    CropCode,
    CropPlotValues
  >,
};

const YES_NO_KEYS = [
  'hasCropActivity',
  'hasVegetables',
  'hasAndeanCrops',
  'hasCereals',
  'hasIndustrialCrops',
  'hasFruitTrees',
  'hasFlowers',
  'hasAromatics',
  'hasNurseries',
] as const;

/** The crops with one of their fields changed. */
export const withPlot = (
  values: CropsValues,
  code: CropCode,
  patch: Partial<CropPlotValues>,
): CropsValues => ({
  ...values,
  plots: { ...values.plots, [code]: { ...values.plots[code], ...patch } },
});

const isCropCode = (code: unknown): code is CropCode =>
  (CROP_CODES as readonly unknown[]).includes(code);

const hasAnything = (plot: CropPlotValues) =>
  [plot.hectares, plot.rows, plot.detail].some((value) => value.trim() !== '');

/**
 * The crops section of the payload: the API's CropsRequest. Only the crops with something typed
 * go, as in the web: the API keeps a row for each crop sent.
 */
export function toCropsPayload(values: CropsValues): Record<string, unknown> {
  return {
    ...Object.fromEntries(YES_NO_KEYS.map((key) => [key, values[key]])),
    nurseryQuantity: toCount(values.nurseryQuantity),
    nurseryDetail: textOrNull(values.nurseryDetail),
    plots: CROP_CODES.filter((code) => hasAnything(values.plots[code])).map((code) => ({
      cropCode: code,
      hectares: toNumber(values.plots[code].hectares),
      rows: toCount(values.plots[code].rows),
      detail: textOrNull(values.plots[code].detail),
    })),
  };
}

/** A saved crops section back into the step. */
export function fromCropsPayload(section: Record<string, unknown>): CropsValues {
  const plots = { ...EMPTY_CROPS.plots };
  const saved = Array.isArray(section.plots) ? (section.plots as unknown[]) : [];
  for (const plot of saved) {
    if (typeof plot !== 'object' || plot === null) continue;
    const { cropCode, hectares, rows, detail } = plot as Record<string, unknown>;
    if (!isCropCode(cropCode)) continue;
    plots[cropCode] = { hectares: asText(hectares), rows: asText(rows), detail: asText(detail) };
  }
  return {
    ...EMPTY_CROPS,
    ...Object.fromEntries(YES_NO_KEYS.map((key) => [key, section[key] === true])),
    nurseryQuantity: asText(section.nurseryQuantity),
    nurseryDetail: asText(section.nurseryDetail),
    plots,
  };
}

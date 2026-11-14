import {
  EMPTY_FARM,
  EMPTY_PRODUCER,
  type FarmValues,
  fromFarmPayload,
  fromProducerPayload,
  type ProducerValues,
  toFarmPayload,
  toProducerPayload,
} from './steps/producer/producer.helper';
import {
  EMPTY_PRODUCTION_UNIT,
  fromProductionUnitPayload,
  type ProductionUnitValues,
  toProductionUnitPayload,
} from './steps/productionUnit/productionUnit.helper';

/** The payload version the API reads (CensusSubmissionService::SCHEMA_VERSION). */
export const SCHEMA_VERSION = 2;

/** The parts of the payload each step fills, shaped like the request the web saves that step with. */
export const CENSUS_SECTIONS = [
  'producer',
  'familyFinances',
  'productionUnit',
  'livestock',
  'crops',
  'farmInputs',
  'infrastructure',
] as const;

export type CensusSection = (typeof CENSUS_SECTIONS)[number];

type Section = Record<string, unknown>;

/** The body of the PUT, as a draft keeps it on the phone. */
export type CensusPayload = {
  schemaVersion: number;
  /** YYYY-MM-DD. */
  date: string | null;
  formNumber: string | null;
  observations: string | null;
  /** "Es otra finca del productor": the API gives the census a new farm. */
  newFarm: boolean;
} & Record<CensusSection, Section>;

/** The sections no step of the app edits yet: kept as they came. */
type RawSection = Exclude<CensusSection, 'producer' | 'productionUnit'>;

/**
 * What the wizard edits. A built step keeps its values as typed and turns them into its section
 * (its helper's toXPayload); a step not built yet keeps its section as it came.
 */
export type CensusFormValues = {
  date: string;
  formNumber: string;
  observations: string;
  newFarm: boolean;
  producer: ProducerValues;
  /** RENSPA and "vive en la finca": asked with the producer, sent in productionUnit. */
  farm: FarmValues;
  productionUnit: ProductionUnitValues;
  sections: Record<RawSection, Section>;
};

const RAW_SECTIONS = CENSUS_SECTIONS.filter(
  (section): section is RawSection => section !== 'producer' && section !== 'productionUnit',
);

const emptySections = (): Record<RawSection, Section> =>
  Object.fromEntries(RAW_SECTIONS.map((section) => [section, {}])) as Record<RawSection, Section>;

/** YYYY-MM-DD of the phone's own day, not UTC: a census taken at 22:00 in Jujuy is of that day. */
export function localIsoDate(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A new census: taken today, nothing else said yet. */
export function emptyCensusValues(now: Date): CensusFormValues {
  return {
    date: localIsoDate(now),
    formNumber: '',
    observations: '',
    newFarm: false,
    producer: EMPTY_PRODUCER,
    farm: EMPTY_FARM,
    productionUnit: EMPTY_PRODUCTION_UNIT,
    sections: emptySections(),
  };
}

const textOrNull = (value: string) => (value.trim() === '' ? null : value.trim());

export function toCensusPayload(values: CensusFormValues): CensusPayload {
  return {
    schemaVersion: SCHEMA_VERSION,
    date: values.date === '' ? null : values.date,
    formNumber: textOrNull(values.formNumber),
    observations: textOrNull(values.observations),
    newFarm: values.newFarm,
    ...values.sections,
    producer: toProducerPayload(values.producer),
    productionUnit: {
      ...toProductionUnitPayload(values.productionUnit),
      ...toFarmPayload(values.farm),
    },
  };
}

const isSection = (value: unknown): value is Section =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringOr = (value: unknown, fallback: string) =>
  typeof value === 'string' ? value : fallback;

/** A saved draft back into the form. Whatever the draft lacks starts empty. */
export function fromCensusPayload(payload: Record<string, unknown>): CensusFormValues {
  const productionUnit = isSection(payload.productionUnit) ? payload.productionUnit : {};
  const sections = emptySections();
  for (const section of RAW_SECTIONS) {
    const value = payload[section];
    if (isSection(value)) sections[section] = value;
  }
  return {
    date: stringOr(payload.date, ''),
    formNumber: stringOr(payload.formNumber, ''),
    observations: stringOr(payload.observations, ''),
    newFarm: payload.newFarm === true,
    producer: fromProducerPayload(isSection(payload.producer) ? payload.producer : {}),
    farm: fromFarmPayload(productionUnit),
    productionUnit: fromProductionUnitPayload(productionUnit),
    sections,
  };
}

/**
 * What stops a census from being finished: the API would only reject it. Everything else the
 * API checks, and a 422 brings the census back to fix.
 */
export function missingToFinish(values: CensusFormValues): ('date' | 'producer')[] {
  const missing: ('date' | 'producer')[] = [];
  if (values.date === '') missing.push('date');
  const { fullName, documentType, documentNumber } = values.producer;
  if ([fullName, documentType, documentNumber].some((field) => field.trim() === '')) {
    missing.push('producer');
  }
  return missing;
}

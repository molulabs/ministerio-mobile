import {
  EMPTY_CROPS,
  fromCropsPayload,
  type CropsValues,
  toCropsPayload,
} from './steps/crops/crops.helper';
import {
  EMPTY_FAMILY_FINANCES,
  type FamilyFinancesValues,
  fromFamilyFinancesPayload,
  toFamilyFinancesPayload,
} from './steps/familyFinances/familyFinances.helper';
import {
  EMPTY_FARM_INPUTS,
  type FarmInputsValues,
  fromFarmInputsPayload,
  hasIncompleteForestation,
  toFarmInputsPayload,
} from './steps/farmInputs/farmInputs.helper';
import {
  EMPTY_INFRASTRUCTURE,
  fromInfrastructurePayload,
  type InfrastructureValues,
  toInfrastructurePayload,
} from './steps/infrastructure/infrastructure.helper';
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
  EMPTY_LIVESTOCK,
  fromLivestockPayload,
  type LivestockValues,
  toLivestockPayload,
} from './steps/livestock/livestock.helper';
import {
  EMPTY_PRODUCTION_UNIT,
  fromProductionUnitPayload,
  type ProductionUnitValues,
  toProductionUnitPayload,
} from './steps/productionUnit/productionUnit.helper';

/**
 * The payload version the API reads (CensusSubmissionService::SCHEMA_VERSION). 4 has no form number:
 * the census taker loads the census here, there is no paper form.
 */
export const SCHEMA_VERSION = 4;

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
  observations: string | null;
  /** "Otra finca": a farm of the producer not censused yet, so the API gives the census a new one. */
  newFarm: boolean;
  /** The producer's farm chosen from the catalogs (schema 3); null for a new one or none known. */
  farmId: number | null;
} & Record<CensusSection, Section>;

/** What the wizard edits: each step keeps its values as typed, and its helper turns them into its section. */
export type CensusFormValues = {
  date: string;
  observations: string;
  newFarm: boolean;
  farmId: number | null;
  producer: ProducerValues;
  familyFinances: FamilyFinancesValues;
  /** RENSPA and "vive en la finca": asked with the producer, sent in productionUnit. */
  farm: FarmValues;
  productionUnit: ProductionUnitValues;
  livestock: LivestockValues;
  crops: CropsValues;
  farmInputs: FarmInputsValues;
  infrastructure: InfrastructureValues;
};

/** YYYY-MM-DD of the phone's own day, not UTC: a census taken at 22:00 in Jujuy is of that day. */
export function localIsoDate(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A new census: taken today, nothing else said yet. */
export function emptyCensusValues(now: Date): CensusFormValues {
  return {
    date: localIsoDate(now),
    observations: '',
    newFarm: false,
    farmId: null,
    producer: EMPTY_PRODUCER,
    familyFinances: EMPTY_FAMILY_FINANCES,
    farm: EMPTY_FARM,
    productionUnit: EMPTY_PRODUCTION_UNIT,
    livestock: EMPTY_LIVESTOCK,
    crops: EMPTY_CROPS,
    farmInputs: EMPTY_FARM_INPUTS,
    infrastructure: EMPTY_INFRASTRUCTURE,
  };
}

const textOrNull = (value: string) => (value.trim() === '' ? null : value.trim());

export function toCensusPayload(values: CensusFormValues): CensusPayload {
  return {
    schemaVersion: SCHEMA_VERSION,
    date: values.date === '' ? null : values.date,
    observations: textOrNull(values.observations),
    newFarm: values.newFarm,
    farmId: values.farmId,
    producer: toProducerPayload(values.producer),
    familyFinances: toFamilyFinancesPayload(values.familyFinances),
    productionUnit: {
      ...toProductionUnitPayload(values.productionUnit),
      ...toFarmPayload(values.farm),
    },
    livestock: toLivestockPayload(values.livestock),
    crops: toCropsPayload(values.crops),
    farmInputs: toFarmInputsPayload(values.farmInputs),
    infrastructure: toInfrastructurePayload(values.infrastructure),
  };
}

const isSection = (value: unknown): value is Section =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sectionOf = (payload: Record<string, unknown>, section: CensusSection): Section => {
  const value = payload[section];
  return isSection(value) ? value : {};
};

const stringOr = (value: unknown, fallback: string) =>
  typeof value === 'string' ? value : fallback;

/** A saved draft back into the form. Whatever the draft lacks starts empty. */
export function fromCensusPayload(payload: Record<string, unknown>): CensusFormValues {
  const productionUnit = sectionOf(payload, 'productionUnit');
  return {
    // A draft of an older version may have a form number: it is left out
    date: stringOr(payload.date, ''),
    observations: stringOr(payload.observations, ''),
    newFarm: payload.newFarm === true,
    farmId: typeof payload.farmId === 'number' ? payload.farmId : null,
    producer: fromProducerPayload(sectionOf(payload, 'producer')),
    familyFinances: fromFamilyFinancesPayload(sectionOf(payload, 'familyFinances')),
    farm: fromFarmPayload(productionUnit),
    productionUnit: fromProductionUnitPayload(productionUnit),
    livestock: fromLivestockPayload(sectionOf(payload, 'livestock')),
    crops: fromCropsPayload(sectionOf(payload, 'crops')),
    farmInputs: fromFarmInputsPayload(sectionOf(payload, 'farmInputs')),
    infrastructure: fromInfrastructurePayload(sectionOf(payload, 'infrastructure')),
  };
}

export type MissingToFinish = 'date' | 'producer' | 'farm' | 'forestation';

/**
 * What stops a census from being finished: the API would only reject it, or the phone would leave
 * out what was typed (a forest row without its species or type). Everything else the API checks,
 * and a 422 brings the census back to fix.
 */
export function missingToFinish(
  values: CensusFormValues,
  /** How many farms the phone knows of the producer: with any, which one must be chosen. */
  producerFarms = 0,
): MissingToFinish[] {
  const missing: MissingToFinish[] = [];
  if (values.date === '') missing.push('date');
  const { fullName, documentType, documentNumber } = values.producer;
  if ([fullName, documentType, documentNumber].some((field) => field.trim() === '')) {
    missing.push('producer');
  }
  if (producerFarms > 0 && values.farmId === null && !values.newFarm) missing.push('farm');
  if (hasIncompleteForestation(values.farmInputs)) missing.push('forestation');
  return missing;
}

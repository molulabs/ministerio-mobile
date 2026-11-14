import {
  asText,
  type LocalityRef,
  textOrNull,
  toCatalogRef,
  toNumber,
} from '../../fields/fields.helper';

/**
 * What the production unit step edits (the web's ProductionUnitValues). The RENSPA and whether
 * the producer lives on the farm are asked with the producer: FarmValues.
 */
export type ProductionUnitValues = {
  street: string;
  /** The house number, or the km of a route. */
  number: string;
  department: string;
  locality: LocalityRef;
  paraje: string;
  latitude: string;
  longitude: string;
  totalHectares: string;
  producedHectares: string;
  landTenure: string[];
  landTenureOtherDetail: string;
  drinkingWater: boolean;
  irrigationWater: boolean;
  electricGrid: boolean;
  gas: boolean;
  telephone: boolean;
  internet: boolean;
};

export const EMPTY_PRODUCTION_UNIT: ProductionUnitValues = {
  street: '',
  number: '',
  department: '',
  locality: null,
  paraje: '',
  latitude: '',
  longitude: '',
  totalHectares: '',
  producedHectares: '',
  landTenure: [],
  landTenureOtherDetail: '',
  drinkingWater: false,
  irrigationWater: false,
  electricGrid: false,
  gas: false,
  telephone: false,
  internet: false,
};

/** More hectares produced than the farm has: told, not stopped (the web's warning). */
export function producesMoreThanItHas(values: ProductionUnitValues): boolean {
  const total = toNumber(values.totalHectares);
  const produced = toNumber(values.producedHectares);
  return total !== null && produced !== null && produced > total;
}

/**
 * The production unit section of the payload (the web's toProductionUnitPayload). The address goes
 * too, and the API ignores it when the producer lives on the farm.
 */
export function toProductionUnitPayload(values: ProductionUnitValues): Record<string, unknown> {
  return {
    street: textOrNull(values.street),
    number: textOrNull(values.number),
    department: textOrNull(values.department),
    localityId: values.locality,
    paraje: textOrNull(values.paraje),
    latitude: toNumber(values.latitude),
    longitude: toNumber(values.longitude),
    totalHectares: toNumber(values.totalHectares),
    producedHectares: toNumber(values.producedHectares),
    landTenure: values.landTenure.length > 0 ? values.landTenure : null,
    landTenureOtherDetail: textOrNull(values.landTenureOtherDetail),
    drinkingWater: values.drinkingWater,
    irrigationWater: values.irrigationWater,
    electricGrid: values.electricGrid,
    gas: values.gas,
    telephone: values.telephone,
    internet: values.internet,
  };
}

const isTrue = (value: unknown) => value === true;

/** A saved production unit section back into the step. */
export function fromProductionUnitPayload(section: Record<string, unknown>): ProductionUnitValues {
  return {
    street: asText(section.street),
    number: asText(section.number),
    department: asText(section.department),
    locality: toCatalogRef(section.localityId),
    paraje: asText(section.paraje),
    latitude: asText(section.latitude),
    longitude: asText(section.longitude),
    totalHectares: asText(section.totalHectares),
    producedHectares: asText(section.producedHectares),
    landTenure: Array.isArray(section.landTenure)
      ? section.landTenure.filter((item): item is string => typeof item === 'string')
      : [],
    landTenureOtherDetail: asText(section.landTenureOtherDetail),
    drinkingWater: isTrue(section.drinkingWater),
    irrigationWater: isTrue(section.irrigationWater),
    electricGrid: isTrue(section.electricGrid),
    gas: isTrue(section.gas),
    telephone: isTrue(section.telephone),
    internet: isTrue(section.internet),
  };
}

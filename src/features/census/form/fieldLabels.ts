import { texts } from '@/src/shared/constants/texts';

import { FIELD_TEXTS } from './fields/fields.constants';
import {
  ANDEAN_ROWS,
  AROMATIC_CODE,
  CEREALS,
  CITRUS,
  type CropCode,
  CROPS_TEXTS,
  FLOWERS,
  INDUSTRIAL,
  POME_FRUIT,
  STONE_FRUIT,
  VEGETABLE_ROWS,
} from './steps/crops/crops.constants';
import {
  CHILDREN,
  FAMILY_FINANCES_TEXTS,
  FINANCES,
  WORKERS,
} from './steps/familyFinances/familyFinances.constants';
import { AGROCHEMICALS, FARM_INPUTS_TEXTS } from './steps/farmInputs/farmInputs.constants';
import {
  FACILITIES,
  INFRASTRUCTURE_TEXTS,
  MACHINERY,
  VEHICLES,
} from './steps/infrastructure/infrastructure.constants';
import {
  EQUINE_ROWS,
  LIVESTOCK_TEXTS,
  POULTRY_FIELDS,
  SPECIES,
} from './steps/livestock/livestock.constants';
import { BREED_KEYS } from './steps/livestock/livestock.helper';
import { PRODUCER_TEXTS } from './steps/producer/producer.constants';
import { PRODUCTION_UNIT_TEXTS } from './steps/productionUnit/productionUnit.constants';

type Labels = Record<string, string>;

const PLACE: Labels = {
  department: FIELD_TEXTS.department,
  municipalityId: FIELD_TEXTS.municipality,
  localityId: FIELD_TEXTS.locality,
  latitude: FIELD_TEXTS.latitude,
  longitude: FIELD_TEXTS.longitude,
};

const pick = <K extends string>(source: Record<K, string>, keys: K[]): Labels =>
  Object.fromEntries(keys.map((key) => [key, source[key]]));

const HEADER: Labels = {
  date: texts.census.form.date,
  observations: texts.census.form.observations,
  newFarm: PRODUCER_TEXTS.newFarm,
};

const PRODUCER: Labels = {
  ...pick(PRODUCER_TEXTS, [
    'fullName',
    'documentType',
    'documentNumber',
    'birthDate',
    'nationality',
    'cuil',
    'phone',
    'email',
    'street',
    'number',
    'postalCode',
    'paraje',
    'community',
    'apartment',
    'brandAndSignals',
  ]),
  ...PLACE,
};

const PRODUCTION_UNIT: Labels = {
  ...pick(PRODUCTION_UNIT_TEXTS, [
    'street',
    'number',
    'paraje',
    'totalHectares',
    'producedHectares',
    'landTenure',
    'landTenureOtherDetail',
    'drinkingWater',
    'irrigationWater',
    'electricGrid',
    'gas',
    'telephone',
    'internet',
  ]),
  ...PLACE,
  renspa: PRODUCER_TEXTS.renspa,
  producerLivesOnFarm: PRODUCER_TEXTS.livesOnFarm,
};

const FAMILY_FINANCES: Labels = {
  ...pick(FAMILY_FINANCES_TEXTS, [
    'hasSpouse',
    'spouseWorksOnFarm',
    'childrenInSchool',
    'technicalAdvisory',
    'technicalAdvisoryOtherDetail',
    'associativism',
    'associativismOtherDetail',
  ]),
  ...Object.fromEntries(
    [...CHILDREN, ...WORKERS, ...FINANCES].map((field) => [field.key, field.label]),
  ),
};

const LIVESTOCK: Labels = {
  hasLivestockActivity: LIVESTOCK_TEXTS.hasActivity,
  hasPoultry: LIVESTOCK_TEXTS.hasPoultry,
  poultryOtherDetail: LIVESTOCK_TEXTS.poultryOtherDetail,
  sheepOrientation: LIVESTOCK_TEXTS.sheepOrientation,
  llamaOtherCamelidsDetail: LIVESTOCK_TEXTS.otherCamelids,
  ...Object.fromEntries(POULTRY_FIELDS.map((field) => [field.key, field.label])),
  ...Object.fromEntries(
    SPECIES.flatMap((species) => {
      const name = species.name ?? species.title.toLowerCase();
      return [
        [species.hasKey, species.question],
        ...species.rows.flatMap((row) => [
          [row.ownKey, `${species.title}: ${row.label}, ${LIVESTOCK_TEXTS.own.toLowerCase()}`],
          [
            row.thirdPartyKey,
            `${species.title}: ${row.label}, ${LIVESTOCK_TEXTS.thirdParty.toLowerCase()}`,
          ],
          ...(row.detail ? [[row.detail.key, `${species.title}: ${row.detail.label}`]] : []),
        ]),
        ...(species.declaredKey
          ? [[species.declaredKey, LIVESTOCK_TEXTS.declaredTotal(name)]]
          : []),
        ...(species.breeds
          ? [[BREED_KEYS[species.breeds.key], `${LIVESTOCK_TEXTS.breeds} (${name})`]]
          : []),
        ...(species.practices ?? []).map((practice) => [
          practice.key,
          `${species.title}: ${practice.label}`,
        ]),
      ];
    }),
  ),
  ...Object.fromEntries(
    EQUINE_ROWS.flatMap((row) =>
      row.breeds
        ? [[BREED_KEYS[row.breeds.key], `${LIVESTOCK_TEXTS.breeds} (${row.label.toLowerCase()})`]]
        : [],
    ),
  ),
};

const CROPS: Labels = {
  hasCropActivity: CROPS_TEXTS.hasActivity,
  hasVegetables: CROPS_TEXTS.hasVegetables,
  hasAndeanCrops: CROPS_TEXTS.hasAndean,
  hasCereals: CROPS_TEXTS.hasCereals,
  hasIndustrialCrops: CROPS_TEXTS.hasIndustrial,
  hasFruitTrees: CROPS_TEXTS.hasFruitTrees,
  hasFlowers: CROPS_TEXTS.hasFlowers,
  hasAromatics: CROPS_TEXTS.hasAromatics,
  hasNurseries: CROPS_TEXTS.hasNurseries,
  nurseryQuantity: `${CROPS_TEXTS.nurseries}: ${CROPS_TEXTS.quantity}`,
  nurseryDetail: `${CROPS_TEXTS.nurseries}: ${CROPS_TEXTS.detail}`,
};

/** "Ajo: Hectáreas", "Avena (ha)": a field of one crop, as its step names it. */
function cropLabel(code: CropCode, part: string): string | null {
  const row = [...VEGETABLE_ROWS, ...ANDEAN_ROWS].find((item) => item.code === code);
  if (row) {
    if (part === 'hectares') return `${row.label}: ${CROPS_TEXTS.hectares}`;
    if (part === 'rows') return `${row.label}: ${CROPS_TEXTS.rows}`;
    return row.detailLabel ?? null;
  }
  if (code === AROMATIC_CODE) {
    const name = part === 'hectares' ? CROPS_TEXTS.hectares : CROPS_TEXTS.detail;
    return `${CROPS_TEXTS.aromatics}: ${name}`;
  }
  for (const group of [CEREALS, INDUSTRIAL, CITRUS, POME_FRUIT, STONE_FRUIT, FLOWERS]) {
    if (part === 'detail' && group.detail?.code === code) return group.detail.label;
    const field = group.fields.find((item) => item.code === code);
    if (field && part === 'hectares') return field.label;
  }
  return null;
}

const FARM_INPUTS: Labels = {
  fertilizers: FARM_INPUTS_TEXTS.fertilizers,
  fertilizersOtherDetail: FARM_INPUTS_TEXTS.fertilizersOtherDetail,
  waterSources: FARM_INPUTS_TEXTS.waterSources,
  forestSpecies: FARM_INPUTS_TEXTS.forestation,
  ...Object.fromEntries(
    AGROCHEMICALS.flatMap((agrochemical) => [
      [agrochemical.usesKey, agrochemical.label],
      [agrochemical.ingredientKey, `${agrochemical.label}: ${FARM_INPUTS_TEXTS.activeIngredient}`],
    ]),
  ),
};

const FOREST_PARTS: Labels = {
  forestSpeciesId: FARM_INPUTS_TEXTS.species,
  type: FARM_INPUTS_TEXTS.type,
  quantity: FARM_INPUTS_TEXTS.quantity,
  hectares: FARM_INPUTS_TEXTS.hectares,
};

const INFRASTRUCTURE: Labels = {
  commercializationChannels: INFRASTRUCTURE_TEXTS.channels,
  ...Object.fromEntries(
    [...MACHINERY, ...VEHICLES, ...FACILITIES].flatMap((row) => [
      [row.key, row.label],
      ...(row.detail ? [[row.detail.key, row.detail.label]] : []),
    ]),
  ),
};

const SECTIONS: Record<string, Labels> = {
  producer: PRODUCER,
  familyFinances: FAMILY_FINANCES,
  productionUnit: PRODUCTION_UNIT,
  livestock: LIVESTOCK,
  crops: CROPS,
  farmInputs: FARM_INPUTS,
  infrastructure: INFRASTRUCTURE,
};

/** A field of a list in the payload: "plots[2].hectares" → the list, the item and the field. */
const LIST_ITEM = /^(\w+)\[(\d+)\](?:\.(\w+))?$/;

const itemOf = (section: unknown, list: string, index: number): Record<string, unknown> => {
  const items = (section as Record<string, unknown> | undefined)?.[list];
  const item = Array.isArray(items) ? items[index] : undefined;
  return typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {};
};

/**
 * What the enumerator calls a field the API rejected ("productionUnit.totalHectares" →
 * "Hectáreas totales"), read against the payload the API rejected: a field of a list
 * ("crops.plots[0].hectares") names the item it was, which only that payload tells. Null when
 * the field is none the phone asks.
 */
export function labelOfField(field: string, payload: Record<string, unknown>): string | null {
  const dot = field.indexOf('.');
  if (dot === -1) return HEADER[field] ?? null;

  const section = field.slice(0, dot);
  const path = field.slice(dot + 1);
  const item = LIST_ITEM.exec(path);

  if (item) {
    const [, list, index, part = ''] = item;
    const data = itemOf(payload[section], list, Number(index));
    if (section === 'crops' && list === 'plots') {
      return cropLabel(data.cropCode as CropCode, part);
    }
    if (section === 'farmInputs' && list === 'forestSpecies') {
      const row = FARM_INPUTS_TEXTS.forestRow(Number(index));
      return FOREST_PARTS[part] ? `${row}: ${FOREST_PARTS[part]}` : row;
    }
    // A breed of a list of breeds: the field that holds them.
    return SECTIONS[section]?.[list] ?? null;
  }

  return SECTIONS[section]?.[path] ?? null;
}

import type { CensusSection } from './censusForm.model';

export type CensusStepKey = CensusSection | 'summary';

/** The steps of the web's wizard, in its order (app: CENSUS_STEPS), with the web's titles. */
export const CENSUS_STEPS: readonly { key: CensusStepKey; title: string }[] = [
  { key: 'producer', title: 'Productor' },
  { key: 'familyFinances', title: 'Familia y finanzas' },
  { key: 'productionUnit', title: 'Unidad productiva' },
  { key: 'livestock', title: 'Pecuaria' },
  { key: 'crops', title: 'Agrícola' },
  { key: 'farmInputs', title: 'Insumos' },
  { key: 'infrastructure', title: 'Infraestructura y comercialización' },
  { key: 'summary', title: 'Resumen' },
];

export const LAST_STEP = CENSUS_STEPS.length - 1;

/** The farm's RENSPA and whether the producer lives there go in productionUnit, but are asked with the producer. */
const ASKED_WITH_THE_PRODUCER = ['productionUnit.renspa', 'productionUnit.producerLivesOnFarm'];

/**
 * The step where a field the API rejected (422, "livestock.hasCattle") is fixed. The header (date,
 * "otra finca") is asked with the producer; the observations, on the summary.
 */
export function stepOfField(field: string): number {
  if (ASKED_WITH_THE_PRODUCER.some((path) => field === path || field.startsWith(`${path}.`))) {
    return 0;
  }
  if (field === 'observations') return LAST_STEP;
  const section = field.split('.')[0];
  const index = CENSUS_STEPS.findIndex((step) => step.key === section);
  return index === -1 ? 0 : index;
}

/** The step a census to fix opens on: the first one with a field the API rejected. */
export function firstStepToFix(errors: { field: string }[]): number {
  return errors.length === 0 ? 0 : Math.min(...errors.map((error) => stepOfField(error.field)));
}

/** A saved step number that still fits the steps (a draft from an older app may not). */
export function clampStep(step: number | null | undefined): number {
  if (step === null || step === undefined || !Number.isInteger(step)) return 0;
  return Math.min(Math.max(step, 0), LAST_STEP);
}

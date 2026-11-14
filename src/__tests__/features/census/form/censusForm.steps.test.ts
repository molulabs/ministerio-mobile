import {
  CENSUS_STEPS,
  clampStep,
  firstStepToFix,
  stepOfField,
} from '@/src/features/census/form/censusForm.steps';

describe('censusForm.steps', () => {
  it('has the steps of the web, in its order', () => {
    expect(CENSUS_STEPS.map((step) => step.title)).toEqual([
      'Productor',
      'Familia y finanzas',
      'Unidad productiva',
      'Pecuaria',
      'Agrícola',
      'Insumos',
      'Infraestructura y comercialización',
      'Resumen',
    ]);
  });

  it('sends a rejected field to the step where it is asked', () => {
    expect(stepOfField('livestock.hasCattle')).toBe(3);
    expect(stepOfField('producer.documentNumber')).toBe(0);
    expect(stepOfField('productionUnit.latitude')).toBe(2);
    expect(stepOfField('observations')).toBe(7);
  });

  it('sends the farm fields asked with the producer to the producer step', () => {
    expect(stepOfField('productionUnit.renspa')).toBe(0);
    expect(stepOfField('productionUnit.producerLivesOnFarm')).toBe(0);
  });

  it('sends the header and anything unknown to the first step', () => {
    expect(stepOfField('date')).toBe(0);
    expect(stepOfField('formNumber')).toBe(0);
    expect(stepOfField('schemaVersion')).toBe(0);
  });

  it('opens a draft on a step that exists', () => {
    expect(clampStep(null)).toBe(0);
    expect(clampStep(3)).toBe(3);
    expect(clampStep(12)).toBe(7);
    expect(clampStep(-1)).toBe(0);
  });

  it('opens a census to fix on the first step with a rejected field', () => {
    expect(
      firstStepToFix([
        { field: 'crops.plots[0].hectares' },
        { field: 'productionUnit.totalHectares' },
        { field: 'observations' },
      ]),
    ).toBe(2);
    expect(firstStepToFix([{ field: 'productionUnit.renspa' }])).toBe(0);
    expect(firstStepToFix([])).toBe(0);
  });
});

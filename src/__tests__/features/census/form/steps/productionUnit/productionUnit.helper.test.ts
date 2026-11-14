import {
  EMPTY_PRODUCTION_UNIT,
  fromProductionUnitPayload,
  producesMoreThanItHas,
  toProductionUnitPayload,
} from '@/src/features/census/form/steps/productionUnit/productionUnit.helper';

describe('productionUnit.helper', () => {
  it('sends the hectares as numbers, with a comma or a point', () => {
    expect(
      toProductionUnitPayload({
        ...EMPTY_PRODUCTION_UNIT,
        totalHectares: '12,5',
        producedHectares: '3',
      }),
    ).toMatchObject({ totalHectares: 12.5, producedHectares: 3 });
  });

  it('sends what was left empty as null, and every service answered', () => {
    expect(toProductionUnitPayload(EMPTY_PRODUCTION_UNIT)).toEqual({
      street: null,
      number: null,
      department: null,
      localityId: null,
      paraje: null,
      latitude: null,
      longitude: null,
      totalHectares: null,
      producedHectares: null,
      landTenure: null,
      landTenureOtherDetail: null,
      drinkingWater: false,
      irrigationWater: false,
      electricGrid: false,
      gas: false,
      telephone: false,
      internet: false,
    });
  });

  it('reads a saved section back as it was', () => {
    const values = {
      ...EMPTY_PRODUCTION_UNIT,
      street: 'Ruta 9',
      department: 'TILCARA',
      locality: { name: 'El Moreno' },
      latitude: '-23.5',
      totalHectares: '10',
      landTenure: ['arrendatario'],
      internet: true,
    };
    expect(fromProductionUnitPayload(toProductionUnitPayload(values))).toEqual(values);
  });

  it('ignores a land tenure that is not a list of options', () => {
    expect(fromProductionUnitPayload({ landTenure: 'propietario' }).landTenure).toEqual([]);
    expect(fromProductionUnitPayload({ landTenure: ['comunidad', 3] }).landTenure).toEqual([
      'comunidad',
    ]);
  });

  it('warns when more hectares are produced than the farm has', () => {
    const values = { ...EMPTY_PRODUCTION_UNIT, totalHectares: '10' };
    expect(producesMoreThanItHas({ ...values, producedHectares: '10,5' })).toBe(true);
    expect(producesMoreThanItHas({ ...values, producedHectares: '10' })).toBe(false);
    expect(producesMoreThanItHas({ ...values, producedHectares: '' })).toBe(false);
  });
});

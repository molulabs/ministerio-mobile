import {
  EMPTY_CROPS,
  fromCropsPayload,
  toCropsPayload,
  withPlot,
} from '@/src/features/census/form/steps/crops/crops.helper';

describe('crops.helper', () => {
  it('sends only the crops with something typed: hectares with a comma, whole rows', () => {
    let values = { ...EMPTY_CROPS, hasCropActivity: true, hasVegetables: true };
    values = withPlot(values, 'vegetable_garlic', { hectares: '1,5', rows: '20' });
    values = withPlot(values, 'vegetable_other1', { detail: ' Rúcula ' });

    expect(toCropsPayload(values)).toMatchObject({
      hasCropActivity: true,
      hasVegetables: true,
      hasCereals: false,
      nurseryQuantity: null,
      plots: [
        { cropCode: 'vegetable_garlic', hectares: 1.5, rows: 20, detail: null },
        { cropCode: 'vegetable_other1', hectares: null, rows: null, detail: 'Rúcula' },
      ],
    });
  });

  it('reads a saved section back as it was, and skips a crop it does not know', () => {
    const values = withPlot(
      { ...EMPTY_CROPS, hasCropActivity: true, hasNurseries: true, nurseryQuantity: '300' },
      'cereal_corn',
      { hectares: '12.5' },
    );
    const payload = toCropsPayload(values);

    expect(fromCropsPayload(payload)).toEqual(values);
    expect(
      fromCropsPayload({ plots: [...(payload.plots as object[]), { cropCode: 'bananas' }] }).plots,
    ).toEqual(values.plots);
  });
});

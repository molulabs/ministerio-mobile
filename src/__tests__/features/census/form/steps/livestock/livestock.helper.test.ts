import {
  declaredTotalDiffers,
  EMPTY_LIVESTOCK,
  fromLivestockPayload,
  sum,
  toLivestockPayload,
} from '@/src/features/census/form/steps/livestock/livestock.helper';

describe('livestock.helper', () => {
  it('sends the counts as whole numbers, and what was left empty as null', () => {
    const payload = toLivestockPayload({
      ...EMPTY_LIVESTOCK,
      cattleCowsOwn: '12',
      cattleBullsOwn: '0',
      cattleCowsThirdParty: '',
      poultryOtherDetail: '  ',
    });

    expect(payload).toMatchObject({
      cattleCowsOwn: 12,
      cattleBullsOwn: 0,
      cattleCowsThirdParty: null,
      poultryOtherDetail: null,
      hasLivestockActivity: false,
      sheepOrientation: null,
    });
  });

  it('sends the breeds where the API reads them, by id or by name when new', () => {
    const payload = toLivestockPayload({
      ...EMPTY_LIVESTOCK,
      cattleBreeds: [3, { name: 'Criolla serrana' }],
    });

    expect(payload.cattleBreedIds).toEqual([3, { name: 'Criolla serrana' }]);
    expect(payload.sheepBreedIds).toEqual([]);
    expect(payload).not.toHaveProperty('cattleBreeds');
  });

  it('reads a saved section back as it was', () => {
    const values = {
      ...EMPTY_LIVESTOCK,
      hasLivestockActivity: true,
      hasSheep: true,
      sheepEwesOwn: '30',
      sheepBreeds: [{ name: 'Merino' }, 7],
      sheepOrientation: ['lana', 'carne'],
      llamaOtherCamelidsDetail: 'Vicuñas',
      goatMandatoryVaccines: true,
    };

    expect(fromLivestockPayload(toLivestockPayload(values))).toEqual(values);
  });

  it('adds up the counts, and tells when the paper total differs', () => {
    const values = { ...EMPTY_LIVESTOCK, cattleCowsOwn: '10', cattleCowsThirdParty: '5' };
    const total = sum(values, ['cattleCowsOwn', 'cattleCowsThirdParty', 'cattleBullsOwn']);

    expect(total).toBe(15);
    expect(declaredTotalDiffers('15', total)).toBe(false);
    expect(declaredTotalDiffers('14', total)).toBe(true);
    expect(declaredTotalDiffers('', total)).toBe(false);
  });
});

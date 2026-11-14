import {
  EMPTY_FAMILY_FINANCES,
  fromFamilyFinancesPayload,
  moreChildrenInSchool,
  sumOf,
  toFamilyFinancesPayload,
} from '@/src/features/census/form/steps/familyFinances/familyFinances.helper';

describe('familyFinances.helper', () => {
  it('sends whole counts, empty lists and texts as null', () => {
    expect(
      toFamilyFinancesPayload({
        ...EMPTY_FAMILY_FINANCES,
        hasSpouse: true,
        adultChildren: '2',
        technicalAdvisory: ['otro'],
        technicalAdvisoryOtherDetail: ' INTA ',
      }),
    ).toEqual({
      hasSpouse: true,
      spouseWorksOnFarm: false,
      isBanked: false,
      hasInsurance: false,
      receivesSocialSubsidy: false,
      adultChildren: 2,
      minorChildren: null,
      childrenInSchool: null,
      familyWorkers: null,
      contractedWorkers: null,
      permanentWorkers: null,
      seasonalWorkers: null,
      dayWorkers: null,
      technicalAdvisory: ['otro'],
      technicalAdvisoryOtherDetail: 'INTA',
      associativism: null,
      associativismOtherDetail: null,
    });
  });

  it('reads a saved section back as it was', () => {
    const values = {
      ...EMPTY_FAMILY_FINANCES,
      isBanked: true,
      minorChildren: '3',
      dayWorkers: '4',
      associativism: ['cooperativa'],
    };
    expect(fromFamilyFinancesPayload(toFamilyFinancesPayload(values))).toEqual(values);
  });

  it('adds up the children, and tells when more of them study than there are', () => {
    const values = { ...EMPTY_FAMILY_FINANCES, adultChildren: '1', minorChildren: '2' };

    expect(sumOf(values, ['adultChildren', 'minorChildren'])).toBe(3);
    expect(moreChildrenInSchool({ ...values, childrenInSchool: '3' })).toBe(false);
    expect(moreChildrenInSchool({ ...values, childrenInSchool: '4' })).toBe(true);
  });
});

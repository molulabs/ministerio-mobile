import {
  emptyCensusValues,
  fromCensusPayload,
  localIsoDate,
  missingToFinish,
  toCensusPayload,
} from '@/src/features/census/form/censusForm.model';

const producer = { fullName: 'Rosa Quispe', documentType: 'DNI', documentNumber: '30111222' };

describe('censusForm.model', () => {
  it('starts a census today, in the phone own day', () => {
    // 23:30 in Jujuy is already the next day in UTC.
    expect(localIsoDate(new Date(2026, 10, 13, 23, 30))).toBe('2026-11-13');
    expect(emptyCensusValues(new Date(2026, 10, 13, 9, 0)).date).toBe('2026-11-13');
  });

  it('builds the body of the PUT, with every section and the schema version', () => {
    const values = {
      ...emptyCensusValues(new Date(2026, 10, 13)),
      formNumber: '  F-12 ',
      sections: { ...emptyCensusValues(new Date()).sections, producer },
    };

    expect(toCensusPayload(values)).toEqual({
      schemaVersion: 2,
      date: '2026-11-13',
      formNumber: 'F-12',
      observations: null,
      newFarm: false,
      producer,
      familyFinances: {},
      productionUnit: {},
      livestock: {},
      crops: {},
      farmInputs: {},
      infrastructure: {},
    });
  });

  it('reads a saved draft back as it was', () => {
    const values = {
      ...emptyCensusValues(new Date(2026, 10, 13)),
      observations: 'Sin novedades',
      newFarm: true,
      sections: { ...emptyCensusValues(new Date()).sections, livestock: { hasCattle: true } },
    };

    expect(fromCensusPayload(toCensusPayload(values))).toEqual(values);
  });

  it('starts empty whatever a draft lacks', () => {
    expect(fromCensusPayload({ producer: 'no es un objeto' })).toEqual({
      date: '',
      formNumber: '',
      observations: '',
      newFarm: false,
      sections: emptyCensusValues(new Date()).sections,
    });
  });

  it('cannot finish without a date or the producer the API requires', () => {
    const values = { ...emptyCensusValues(new Date()), date: '' };
    expect(missingToFinish(values)).toEqual(['date', 'producer']);

    const withProducer = {
      ...emptyCensusValues(new Date()),
      sections: { ...emptyCensusValues(new Date()).sections, producer },
    };
    expect(missingToFinish(withProducer)).toEqual([]);
  });

  it('takes a blank name or document as missing', () => {
    const values = {
      ...emptyCensusValues(new Date()),
      sections: {
        ...emptyCensusValues(new Date()).sections,
        producer: { ...producer, documentNumber: '  ' },
      },
    };
    expect(missingToFinish(values)).toEqual(['producer']);
  });
});

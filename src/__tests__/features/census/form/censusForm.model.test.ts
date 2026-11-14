import {
  emptyCensusValues,
  fromCensusPayload,
  localIsoDate,
  missingToFinish,
  toCensusPayload,
} from '@/src/features/census/form/censusForm.model';
import {
  EMPTY_FARM,
  EMPTY_PRODUCER,
} from '@/src/features/census/form/steps/producer/producer.helper';

const producer = {
  ...EMPTY_PRODUCER,
  fullName: 'Rosa Quispe',
  documentType: 'DNI',
  documentNumber: '30111222',
};

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
      producer,
      farm: { renspa: ' 01.234 ', producerLivesOnFarm: true },
    };

    expect(toCensusPayload(values)).toEqual({
      schemaVersion: 2,
      date: '2026-11-13',
      formNumber: 'F-12',
      observations: null,
      newFarm: false,
      producer: expect.objectContaining({
        fullName: 'Rosa Quispe',
        documentType: 'DNI',
        documentNumber: '30111222',
        phone: null,
      }),
      familyFinances: {},
      // The farm is asked with the producer, and travels in the production unit.
      productionUnit: { renspa: '01.234', producerLivesOnFarm: true },
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
      producer: { ...producer, locality: { name: 'Nueva' }, latitude: '-23.1', longitude: '-65.4' },
      farm: { renspa: 'R-1', producerLivesOnFarm: false },
      sections: {
        ...emptyCensusValues(new Date()).sections,
        livestock: { hasCattle: true },
        productionUnit: { surface: 12 },
      },
    };

    expect(fromCensusPayload(toCensusPayload(values))).toEqual(values);
  });

  it('starts empty whatever a draft lacks', () => {
    expect(fromCensusPayload({ producer: 'no es un objeto' })).toEqual({
      date: '',
      formNumber: '',
      observations: '',
      newFarm: false,
      producer: EMPTY_PRODUCER,
      farm: EMPTY_FARM,
      sections: emptyCensusValues(new Date()).sections,
    });
  });

  it('cannot finish without a date or the producer the API requires', () => {
    const values = { ...emptyCensusValues(new Date()), date: '' };
    expect(missingToFinish(values)).toEqual(['date', 'producer']);

    expect(missingToFinish({ ...emptyCensusValues(new Date()), producer })).toEqual([]);
  });

  it('takes a blank name or document as missing', () => {
    const values = {
      ...emptyCensusValues(new Date()),
      producer: { ...producer, documentNumber: '  ' },
    };
    expect(missingToFinish(values)).toEqual(['producer']);
  });
});

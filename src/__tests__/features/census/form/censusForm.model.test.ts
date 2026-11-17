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
import { EMPTY_FAMILY_FINANCES } from '@/src/features/census/form/steps/familyFinances/familyFinances.helper';
import { EMPTY_CROPS, withPlot } from '@/src/features/census/form/steps/crops/crops.helper';
import {
  EMPTY_FARM_INPUTS,
  newForestRow,
} from '@/src/features/census/form/steps/farmInputs/farmInputs.helper';
import { EMPTY_INFRASTRUCTURE } from '@/src/features/census/form/steps/infrastructure/infrastructure.helper';
import { EMPTY_LIVESTOCK } from '@/src/features/census/form/steps/livestock/livestock.helper';
import { EMPTY_PRODUCTION_UNIT } from '@/src/features/census/form/steps/productionUnit/productionUnit.helper';

const producer = {
  ...EMPTY_PRODUCER,
  fullName: 'Rosa Ficticia',
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
      producer,
      farmId: 7,
      farm: { renspa: ' 01.234 ', producerLivesOnFarm: true },
    };

    expect(toCensusPayload(values)).toEqual({
      schemaVersion: 4,
      date: '2026-11-13',
      observations: null,
      newFarm: false,
      farmId: 7,
      producer: expect.objectContaining({
        fullName: 'Rosa Ficticia',
        documentType: 'DNI',
        documentNumber: '30111222',
        phone: null,
      }),
      familyFinances: expect.objectContaining({ hasSpouse: false, adultChildren: null }),
      // The farm is asked with the producer, and travels in the production unit.
      productionUnit: expect.objectContaining({
        renspa: '01.234',
        producerLivesOnFarm: true,
        totalHectares: null,
        drinkingWater: false,
      }),
      livestock: expect.objectContaining({ hasLivestockActivity: false, cattleBreedIds: [] }),
      crops: expect.objectContaining({ hasCropActivity: false, plots: [] }),
      farmInputs: expect.objectContaining({ fertilizers: null, forestSpecies: [] }),
      infrastructure: expect.objectContaining({ tractors: null, commercializationChannels: null }),
    });
  });

  it('reads a saved draft back as it was', () => {
    const values = {
      ...emptyCensusValues(new Date(2026, 10, 13)),
      observations: 'Sin novedades',
      newFarm: true,
      producer: { ...producer, locality: { name: 'Nueva' }, latitude: '-23.1', longitude: '-65.4' },
      farm: { renspa: 'R-1', producerLivesOnFarm: false },
      productionUnit: {
        ...EMPTY_PRODUCTION_UNIT,
        totalHectares: '12.5',
        landTenure: ['propietario', 'otros'],
        landTenureOtherDetail: 'Comodato',
        locality: 4,
        gas: true,
      },
      livestock: {
        ...EMPTY_LIVESTOCK,
        hasLivestockActivity: true,
        hasCattle: true,
        cattleCowsOwn: '4',
      },
      crops: withPlot({ ...EMPTY_CROPS, hasCropActivity: true }, 'vegetable_garlic', {
        hectares: '1.5',
        rows: '20',
      }),
      farmInputs: { ...EMPTY_FARM_INPUTS, fertilizers: ['urea'], usesHerbicides: true },
      infrastructure: {
        ...EMPTY_INFRASTRUCTURE,
        tractors: '2',
        commercializationChannels: ['ferias'],
      },
      familyFinances: { ...EMPTY_FAMILY_FINANCES, hasSpouse: true, minorChildren: '2' },
    };

    expect(fromCensusPayload(toCensusPayload(values))).toEqual(values);
  });

  it('starts empty whatever a draft lacks', () => {
    expect(fromCensusPayload({ producer: 'no es un objeto' })).toEqual({
      date: '',
      observations: '',
      newFarm: false,
      farmId: null,
      producer: EMPTY_PRODUCER,
      farm: EMPTY_FARM,
      productionUnit: EMPTY_PRODUCTION_UNIT,
      livestock: EMPTY_LIVESTOCK,
      crops: EMPTY_CROPS,
      farmInputs: EMPTY_FARM_INPUTS,
      infrastructure: EMPTY_INFRASTRUCTURE,
      familyFinances: EMPTY_FAMILY_FINANCES,
    });
  });

  it('cannot finish without a date or the producer the API requires', () => {
    const values = { ...emptyCensusValues(new Date()), date: '' };
    expect(missingToFinish(values)).toEqual(['date', 'producer']);

    expect(missingToFinish({ ...emptyCensusValues(new Date()), producer })).toEqual([]);
  });

  it('cannot finish without choosing which farm of a producer with farms it is', () => {
    const values = { ...emptyCensusValues(new Date()), producer };
    expect(missingToFinish(values, 2)).toEqual(['farm']);

    expect(missingToFinish({ ...values, farmId: 7 }, 2)).toEqual([]);
    expect(missingToFinish({ ...values, newFarm: true }, 2)).toEqual([]);
  });

  it('takes a blank name or document as missing', () => {
    const values = {
      ...emptyCensusValues(new Date()),
      producer: { ...producer, documentNumber: '  ' },
    };
    expect(missingToFinish(values)).toEqual(['producer']);
  });

  it('cannot finish with a forest row the API would not take: it would be left out', () => {
    const values = {
      ...emptyCensusValues(new Date()),
      producer,
      farmInputs: {
        ...EMPTY_FARM_INPUTS,
        forestSpecies: [newForestRow(), newForestRow({ quantity: '30' })],
      },
    };
    expect(missingToFinish(values)).toEqual(['forestation']);
  });
});

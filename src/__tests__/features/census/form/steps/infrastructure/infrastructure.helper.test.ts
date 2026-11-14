import {
  EMPTY_INFRASTRUCTURE,
  fromInfrastructurePayload,
  toInfrastructurePayload,
} from '@/src/features/census/form/steps/infrastructure/infrastructure.helper';

describe('infrastructure.helper', () => {
  it('sends whole counts, and what was left empty as null', () => {
    expect(
      toInfrastructurePayload({
        ...EMPTY_INFRASTRUCTURE,
        tractors: '2',
        otherVehicles: '1',
        otherVehiclesDetail: ' Moto ',
      }),
    ).toMatchObject({
      tractors: 2,
      harrows: null,
      otherVehicles: 1,
      otherVehiclesDetail: 'Moto',
      otherMachinery1Detail: null,
      commercializationChannels: null,
    });
  });

  it('reads a saved section back as it was', () => {
    const values = {
      ...EMPTY_INFRASTRUCTURE,
      corrals: '3',
      commercializationChannels: ['directa', 'ferias'],
    };
    expect(fromInfrastructurePayload(toInfrastructurePayload(values))).toEqual(values);
  });
});

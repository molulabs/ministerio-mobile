import {
  EMPTY_PRODUCER,
  fromProducerPayload,
  newProducer,
  registeredProducer,
  toFarmPayload,
  toProducerPayload,
} from '@/src/features/census/form/steps/producer/producer.helper';

describe('producer.helper', () => {
  it('starts a new producer with the document searched, a CUIL by its 11 digits', () => {
    expect(newProducer('30.111.222')).toMatchObject({
      documentNumber: '30111222',
      documentType: 'DNI',
      fullName: '',
      nationality: 'Argentina',
    });
    expect(newProducer('20-30111222-3')).toMatchObject({
      documentNumber: '20301112223',
      documentType: 'CUIL',
    });
  });

  it('starts a new producer with the name searched when it is not a number', () => {
    expect(newProducer(' Rosa Quispe ')).toMatchObject({
      fullName: 'Rosa Quispe',
      documentNumber: '',
    });
  });

  it('starts a registered producer with only what the phone knows, not even the nationality', () => {
    expect(registeredProducer({ documentNumber: '30111222', fullName: 'Rosa Quispe' })).toEqual({
      ...EMPTY_PRODUCER,
      fullName: 'Rosa Quispe',
      documentNumber: '30111222',
      documentType: 'DNI',
    });
  });

  it('sends what was left empty as null, so it erases nothing of a registered producer', () => {
    const payload = toProducerPayload({
      ...EMPTY_PRODUCER,
      fullName: ' Rosa Quispe ',
      documentNumber: '30.111.222',
      phone: '  ',
      street: ' Ruta 9 ',
    });

    expect(payload).toMatchObject({
      fullName: 'Rosa Quispe',
      documentNumber: '30111222',
      phone: null,
      street: 'Ruta 9',
      nationality: null,
      localityId: null,
      latitude: null,
    });
  });

  it('keeps the letters of a passport', () => {
    expect(
      toProducerPayload({ ...EMPTY_PRODUCER, documentType: 'PASAPORTE', documentNumber: ' AB123 ' })
        .documentNumber,
    ).toBe('AB123');
  });

  it('sends the coordinates as numbers, and half-typed ones as none', () => {
    expect(
      toProducerPayload({ ...EMPTY_PRODUCER, latitude: '-23,5', longitude: '-' }),
    ).toMatchObject({ latitude: -23.5, longitude: null });
  });

  it('sends a locality the catalog lacks by its name, and reads it back', () => {
    const payload = toProducerPayload({ ...EMPTY_PRODUCER, locality: { name: 'El Moreno' } });
    expect(payload.localityId).toEqual({ name: 'El Moreno' });
    expect(fromProducerPayload(payload).locality).toEqual({ name: 'El Moreno' });
    expect(fromProducerPayload({ localityId: 12 }).locality).toBe(12);
    expect(fromProducerPayload({ localityId: { name: ' ' } }).locality).toBeNull();
  });

  it('sends the farm with a blank RENSPA as none', () => {
    expect(toFarmPayload({ renspa: ' ', producerLivesOnFarm: true })).toEqual({
      renspa: null,
      producerLivesOnFarm: true,
    });
  });
});

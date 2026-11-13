/**
 * A census the API accepts, to try the outbox before the census form exists: the smallest one,
 * as the API's own test sends it (MobileCensusSubmissionControllerTest::payload). Every one goes
 * to the same made-up producer; without a form number, so none is held for a repeated one.
 */
export function testCensusPayload(date: Date = new Date()): Record<string, unknown> {
  return {
    date: date.toISOString().slice(0, 10),
    formNumber: null,
    observations: 'Censo de prueba creado desde la app de desarrollo.',
    producer: {
      fullName: 'Productor de prueba (app)',
      documentType: 'DNI',
      documentNumber: '99000001',
    },
    familyFinances: {},
    productionUnit: {},
    livestock: {},
    crops: {},
    farmInputs: {},
    infrastructure: {},
  };
}

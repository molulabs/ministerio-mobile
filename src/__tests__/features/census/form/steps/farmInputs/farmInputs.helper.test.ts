import {
  EMPTY_FARM_INPUTS,
  fromFarmInputsPayload,
  hasIncompleteForestation,
  newForestRow,
  toFarmInputsPayload,
} from '@/src/features/census/form/steps/farmInputs/farmInputs.helper';

describe('farmInputs.helper', () => {
  it('sends the forest rows with their species, by id or by name, and leaves the empty ones out', () => {
    const payload = toFarmInputsPayload({
      ...EMPTY_FARM_INPUTS,
      usesHerbicides: true,
      herbicidesActiveIngredient: ' Glifosato ',
      forestSpecies: [
        newForestRow({ species: 3, type: 'PLANTED', quantity: '40', hectares: '0,5' }),
        newForestRow({ species: { name: 'Queñoa' }, type: 'NATIVE' }),
        newForestRow(),
      ],
    });

    expect(payload).toMatchObject({
      fertilizers: null,
      waterSources: null,
      usesHerbicides: true,
      herbicidesActiveIngredient: 'Glifosato',
      usesInsecticides: false,
      forestSpecies: [
        { forestSpeciesId: 3, type: 'PLANTED', quantity: 40, hectares: 0.5 },
        { forestSpeciesId: { name: 'Queñoa' }, type: 'NATIVE', quantity: null, hectares: null },
      ],
    });
  });

  it('tells a row with something typed but no species or type', () => {
    const values = (row: ReturnType<typeof newForestRow>) => ({
      ...EMPTY_FARM_INPUTS,
      forestSpecies: [row],
    });

    expect(hasIncompleteForestation(values(newForestRow()))).toBe(false);
    expect(hasIncompleteForestation(values(newForestRow({ hectares: '2' })))).toBe(true);
    expect(hasIncompleteForestation(values(newForestRow({ species: 3 })))).toBe(true);
    expect(hasIncompleteForestation(values(newForestRow({ species: 3, type: 'NATIVE' })))).toBe(
      false,
    );
  });

  it('reads a saved section back as it was', () => {
    const values = {
      ...EMPTY_FARM_INPUTS,
      fertilizers: ['urea', 'otros'],
      fertilizersOtherDetail: 'Compost',
      waterSources: ['pozo'],
      forestSpecies: [newForestRow({ species: { name: 'Queñoa' }, type: 'NATIVE' as const })],
    };

    const back = fromFarmInputsPayload(toFarmInputsPayload(values));

    expect({ ...back, forestSpecies: [] }).toEqual({ ...values, forestSpecies: [] });
    expect(back.forestSpecies).toEqual([{ ...values.forestSpecies[0], key: expect.any(String) }]);
  });
});

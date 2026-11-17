import {
  CENSUS_SECTIONS,
  emptyCensusValues,
  toCensusPayload,
} from '@/src/features/census/form/censusForm.model';
import { labelOfField } from '@/src/features/census/form/fieldLabels';

describe('labelOfField', () => {
  const payload = {
    crops: {
      plots: [
        { cropCode: 'vegetable_garlic', hectares: 1.5 },
        { cropCode: 'cereal_oats', hectares: 2 },
        { cropCode: 'fruit_tree_citrus_other', detail: 'Lima' },
      ],
    },
    farmInputs: { forestSpecies: [{ forestSpeciesId: 3, type: 'NATIVE' }, {}] },
  };

  it('names a field as the form shows it', () => {
    expect(labelOfField('productionUnit.totalHectares', payload)).toBe('Hectáreas totales');
    expect(labelOfField('productionUnit.renspa', payload)).toBe('RENSPA N°');
    expect(labelOfField('producer.localityId', payload)).toBe('Localidad');
    expect(labelOfField('familyFinances.dayWorkers', payload)).toBe('Jornaleros');
    expect(labelOfField('infrastructure.otherVehiclesDetail', payload)).toBe(
      'Detalle de "otros" (vehículos)',
    );
    expect(labelOfField('observations', payload)).toBe('Observaciones');
  });

  it('names the livestock counts with their species, and the breeds by species', () => {
    expect(labelOfField('livestock.goatWethersOwn', payload)).toBe('Caprinos: Capones, propios');
    expect(labelOfField('livestock.llamaGeldingsThirdParty', payload)).toBe(
      'Llamas: Capones, de terceros',
    );
    expect(labelOfField('livestock.cattleDeclaredTotal', payload)).toBe(
      'Total declarado en el papel (bovinos)',
    );
    expect(labelOfField('livestock.sheepBreedIds[1]', payload)).toBe('Razas (ovinos)');
    expect(labelOfField('livestock.donkeyBreedIds[0]', payload)).toBe('Razas (asnal)');
    expect(labelOfField('livestock.goatMandatoryVaccines', payload)).toBe(
      'Caprinos: Vacunas obligatorias',
    );
  });

  it('names the crop of a plot, which only the rejected payload tells', () => {
    expect(labelOfField('crops.plots[0].hectares', payload)).toBe('Ajo: Hectáreas');
    expect(labelOfField('crops.plots[0].rows', payload)).toBe('Ajo: Rayas');
    expect(labelOfField('crops.plots[1].hectares', payload)).toBe('Avena (ha)');
    expect(labelOfField('crops.plots[2].detail', payload)).toBe('Detalle de "otros" (cítricos)');
  });

  it('names the forest row by its place', () => {
    expect(labelOfField('farmInputs.forestSpecies[1].type', payload)).toBe('Especie 2: Tipo');
    expect(labelOfField('farmInputs.forestSpecies[0].forestSpeciesId', payload)).toBe(
      'Especie 1: Especie',
    );
  });

  it('has no name for a field the phone does not ask', () => {
    expect(labelOfField('producer.somethingNew', payload)).toBeNull();
    expect(labelOfField('crops.plots[9].hectares', payload)).toBeNull();
    expect(labelOfField('somewhere', payload)).toBeNull();
  });

  it('names every field the phone sends', () => {
    const sent = toCensusPayload(emptyCensusValues(new Date()));
    const unnamed = CENSUS_SECTIONS.flatMap((section) =>
      Object.keys(sent[section])
        .filter((key) => key !== 'plots')
        .map((key) => `${section}.${key}`),
    ).filter((field) => labelOfField(field, sent) === null);

    expect(unnamed).toEqual([]);
  });
});

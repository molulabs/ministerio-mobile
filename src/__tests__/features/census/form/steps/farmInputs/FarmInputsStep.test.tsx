import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { useState } from 'react';

import { FarmInputsStep } from '@/src/features/census/form/steps/farmInputs/FarmInputsStep';
import {
  EMPTY_FARM_INPUTS,
  type FarmInputsValues,
} from '@/src/features/census/form/steps/farmInputs/farmInputs.helper';

// The forest species live in the local database, which tests do not open.
jest.mock('@/src/features/census/catalogs.queries', () => ({
  useForestSpecies: () => [
    { id: 1, name: 'Algarrobo' },
    { id: 2, name: 'Eucalipto' },
  ],
}));

async function renderStep(initial: Partial<FarmInputsValues> = {}) {
  const latest = { current: { ...EMPTY_FARM_INPUTS, ...initial } };
  function Host() {
    const [values, setValues] = useState(latest.current);
    return (
      <FarmInputsStep
        values={values}
        onChange={(next) => {
          latest.current = next;
          setValues(next);
        }}
      />
    );
  }
  await render(<Host />);
  return latest;
}

describe('FarmInputsStep', () => {
  it('asks the detail of "otros" fertilizers only when they are used', async () => {
    const latest = await renderStep();

    expect(screen.queryByLabelText('Detalle de "otros" (fertilizantes)')).toBeNull();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Otros' }));
    await fireEvent.changeText(
      screen.getByLabelText('Detalle de "otros" (fertilizantes)'),
      'Compost',
    );

    expect(latest.current).toMatchObject({
      fertilizers: ['otros'],
      fertilizersOtherDetail: 'Compost',
    });
  });

  it('asks the active ingredient of an agrochemical used', async () => {
    const latest = await renderStep();

    await fireEvent.press(
      within(screen.getByLabelText('Herbicidas')).getByRole('radio', { name: 'Sí' }),
    );
    await fireEvent.changeText(screen.getByLabelText('Herbicidas: Principio activo'), 'Glifosato');

    expect(latest.current).toMatchObject({
      usesHerbicides: true,
      herbicidesActiveIngredient: 'Glifosato',
    });
  });

  it('adds a forest species, of the catalog, with its type, quantity and hectares', async () => {
    const latest = await renderStep();

    await fireEvent.press(screen.getByRole('button', { name: 'Agregar especie' }));
    await fireEvent.press(screen.getByLabelText('Especie'));
    await fireEvent.press(await screen.findByText('Eucalipto'));
    await fireEvent.press(
      within(screen.getByLabelText('Tipo (especie 1)')).getByRole('radio', { name: 'Implantada' }),
    );
    await fireEvent.changeText(screen.getByLabelText('Especie 1: Cantidad'), '40');

    expect(latest.current.forestSpecies).toEqual([
      expect.objectContaining({ species: 2, type: 'PLANTED', quantity: '40', hectares: '' }),
    ]);
  });

  it('says what a forest row lacks, and removes it', async () => {
    const latest = await renderStep();

    await fireEvent.press(screen.getByRole('button', { name: 'Agregar especie' }));
    await fireEvent.changeText(screen.getByLabelText('Especie 1: Hectáreas'), '2');

    expect(screen.getAllByText('Elegí la especie y el tipo, o quitá la fila.')).toHaveLength(2);

    await fireEvent.press(screen.getByRole('button', { name: 'Quitar especie 1' }));
    expect(latest.current.forestSpecies).toEqual([]);
  });
});

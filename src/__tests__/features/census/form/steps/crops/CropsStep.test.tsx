import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { useState } from 'react';

import { CropsStep } from '@/src/features/census/form/steps/crops/CropsStep';
import { type CropsValues, EMPTY_CROPS } from '@/src/features/census/form/steps/crops/crops.helper';

async function renderStep(initial: Partial<CropsValues> = {}) {
  const latest = { current: { ...EMPTY_CROPS, ...initial } };
  function Host() {
    const [values, setValues] = useState(latest.current);
    return (
      <CropsStep
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

const yes = (question: string) =>
  fireEvent.press(within(screen.getByLabelText(question)).getByRole('radio', { name: 'Sí' }));

describe('CropsStep', () => {
  it('asks about each kind of crop only when the farm has crops', async () => {
    await renderStep();

    expect(screen.queryByLabelText('¿Posee hortalizas?')).toBeNull();
    await yes('¿Registra actividad agrícola?');
    expect(screen.getByLabelText('¿Posee hortalizas?')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Ajo: Hectáreas')).toBeNull();
  });

  it('asks the hectares and rows of each vegetable', async () => {
    const latest = await renderStep({ hasCropActivity: true });

    await yes('¿Posee hortalizas?');
    await fireEvent.changeText(screen.getByLabelText('Ajo: Hectáreas'), '1,5');
    await fireEvent.changeText(screen.getByLabelText('Ajo: Rayas'), '20');
    await fireEvent.changeText(screen.getByLabelText('Detalle (otros 1)'), 'Rúcula');

    expect(latest.current.plots.vegetable_garlic).toEqual({
      hectares: '1,5',
      rows: '20',
      detail: '',
    });
    expect(latest.current.plots.vegetable_other1.detail).toBe('Rúcula');
  });

  it('asks the fruit trees by group, in hectares, with the detail of their "otros"', async () => {
    const latest = await renderStep({ hasCropActivity: true, hasFruitTrees: true });

    await fireEvent.changeText(screen.getByLabelText('Limonero (ha)'), '3');
    await fireEvent.changeText(screen.getByLabelText('Detalle de "otros" (carozo)'), 'Cerezo');

    expect(latest.current.plots.fruit_tree_lemon.hectares).toBe('3');
    expect(latest.current.plots.fruit_tree_stone_fruit_other.detail).toBe('Cerezo');
  });

  it('asks how many nurseries and what they are', async () => {
    const latest = await renderStep({ hasCropActivity: true });

    await yes('¿Posee viveros?');
    await fireEvent.changeText(screen.getByLabelText('Viveros: Cantidad'), '2');
    await fireEvent.changeText(screen.getByLabelText('Viveros: Detalle'), 'Plantines');

    expect(latest.current).toMatchObject({
      hasNurseries: true,
      nurseryQuantity: '2',
      nurseryDetail: 'Plantines',
    });
  });
});

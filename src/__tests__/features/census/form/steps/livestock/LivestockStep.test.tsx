import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { useState } from 'react';

import { LivestockStep } from '@/src/features/census/form/steps/livestock/LivestockStep';
import {
  EMPTY_LIVESTOCK,
  type LivestockValues,
} from '@/src/features/census/form/steps/livestock/livestock.helper';

// The breeds live in the local database, which tests do not open.
jest.mock('@/src/features/census/catalogs.queries', () => ({
  useBreeds: (species: string) =>
    species === 'CATTLE'
      ? [
          { id: 1, name: 'Criolla' },
          { id: 2, name: 'Hereford' },
        ]
      : [],
}));

/** The step as the wizard holds it, with what it was last given. */
async function renderStep(initial: Partial<LivestockValues> = {}) {
  const latest = { current: { ...EMPTY_LIVESTOCK, ...initial } };
  function Host() {
    const [values, setValues] = useState(latest.current);
    return (
      <LivestockStep
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

describe('LivestockStep', () => {
  it('asks about the species only when the farm has livestock', async () => {
    await renderStep();

    expect(screen.queryByLabelText('¿Posee bovinos?')).toBeNull();
    await yes('¿Registra actividad pecuaria?');
    expect(screen.getByLabelText('¿Posee bovinos?')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Vacas: Propios')).toBeNull();
  });

  it('counts each kind of animal, own and of third parties, and adds them up', async () => {
    const latest = await renderStep({ hasLivestockActivity: true });

    await yes('¿Posee bovinos?');
    await fireEvent.changeText(screen.getByLabelText('Vacas: Propios'), '10');
    await fireEvent.changeText(screen.getByLabelText('Vacas: De terceros'), '3');
    await fireEvent.changeText(screen.getByLabelText('Toros: Propios'), '1');

    expect(latest.current).toMatchObject({
      hasCattle: true,
      cattleCowsOwn: '10',
      cattleCowsThirdParty: '3',
      cattleBullsOwn: '1',
    });
    expect(screen.getByText('Total bovinos (calculado): 14')).toBeOnTheScreen();
  });

  it('warns when the total of the paper form differs, without stopping', async () => {
    const latest = await renderStep({
      hasLivestockActivity: true,
      hasCattle: true,
      cattleCowsOwn: '10',
    });

    await fireEvent.changeText(
      screen.getByLabelText('Total declarado en el papel (bovinos)'),
      '12',
    );

    expect(screen.getByText('El total del papel no coincide con la suma')).toBeOnTheScreen();
    expect(latest.current.cattleDeclaredTotal).toBe('12');
  });

  it('picks breeds of the catalog, and adds one the phone lacks by its name', async () => {
    const latest = await renderStep({ hasLivestockActivity: true, hasCattle: true });

    await fireEvent.press(screen.getByLabelText('Razas (bovinos)'));
    await fireEvent.press(await screen.findByText('Hereford'));
    await fireEvent.changeText(screen.getByRole('search'), 'Criolla serrana');
    await fireEvent.press(await screen.findByText('Agregar raza «Criolla serrana»'));

    expect(latest.current.cattleBreeds).toEqual([2, { name: 'Criolla serrana' }]);
  });

  it('asks the practices of the goats', async () => {
    const latest = await renderStep({ hasLivestockActivity: true });

    await yes('¿Posee caprinos?');
    await yes('Vacunas obligatorias');

    expect(latest.current).toMatchObject({ hasGoats: true, goatMandatoryVaccines: true });
  });

  it('asks the detail of the other poultry and of the other equines', async () => {
    const latest = await renderStep({
      hasLivestockActivity: true,
      hasPoultry: true,
      hasEquines: true,
    });

    await fireEvent.changeText(screen.getByLabelText('Detalle de "otros" (aves)'), 'Gansos');
    await fireEvent.changeText(screen.getByLabelText('Detalle'), 'Mulas');

    expect(latest.current).toMatchObject({
      poultryOtherDetail: 'Gansos',
      equineOtherDetail: 'Mulas',
    });
  });
});

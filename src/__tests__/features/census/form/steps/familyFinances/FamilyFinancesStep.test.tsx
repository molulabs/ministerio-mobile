import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { useState } from 'react';

import { FamilyFinancesStep } from '@/src/features/census/form/steps/familyFinances/FamilyFinancesStep';
import {
  EMPTY_FAMILY_FINANCES,
  type FamilyFinancesValues,
} from '@/src/features/census/form/steps/familyFinances/familyFinances.helper';

async function renderStep() {
  const latest = { current: EMPTY_FAMILY_FINANCES };
  function Host() {
    const [values, setValues] = useState<FamilyFinancesValues>(latest.current);
    return (
      <FamilyFinancesStep
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

describe('FamilyFinancesStep', () => {
  it('asks whether the spouse works on the farm only when there is one', async () => {
    const latest = await renderStep();

    expect(screen.queryByLabelText('El cónyuge trabaja en la finca')).toBeNull();
    await yes('Cónyuge');
    await yes('El cónyuge trabaja en la finca');

    expect(latest.current).toMatchObject({ hasSpouse: true, spouseWorksOnFarm: true });
  });

  it('adds up the children, and warns when more of them study, without stopping', async () => {
    const latest = await renderStep();

    await fireEvent.changeText(screen.getByLabelText('Hijos mayores'), '1');
    await fireEvent.changeText(screen.getByLabelText('Hijos menores'), '2');
    await fireEvent.changeText(screen.getByLabelText('Hijos que estudian'), '4');

    expect(screen.getByText('Total de hijos (calculado): 3')).toBeOnTheScreen();
    expect(screen.getByText('Hay más hijos estudiando que hijos declarados')).toBeOnTheScreen();
    expect(latest.current.childrenInSchool).toBe('4');
  });

  it('asks the detail of "otro" advice', async () => {
    const latest = await renderStep();

    await fireEvent.press(screen.getAllByRole('checkbox', { name: 'Otro' })[0]);
    await fireEvent.changeText(screen.getByLabelText('Detalle de "otro" (asesoramiento)'), 'INTA');

    expect(latest.current).toMatchObject({
      technicalAdvisory: ['otro'],
      technicalAdvisoryOtherDetail: 'INTA',
    });
  });

  it('counts who works on the farm', async () => {
    const latest = await renderStep();

    await yes('Bancarizado');
    await fireEvent.changeText(screen.getByLabelText('Familiares'), '2');
    await fireEvent.changeText(screen.getByLabelText('Jornaleros'), '5');

    expect(screen.getByText('Total de mano de obra (calculado): 7')).toBeOnTheScreen();
    expect(latest.current).toMatchObject({ isBanked: true, familyWorkers: '2', dayWorkers: '5' });
  });
});

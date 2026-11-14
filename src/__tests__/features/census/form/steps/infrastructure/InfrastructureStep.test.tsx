import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { InfrastructureStep } from '@/src/features/census/form/steps/infrastructure/InfrastructureStep';
import {
  EMPTY_INFRASTRUCTURE,
  type InfrastructureValues,
} from '@/src/features/census/form/steps/infrastructure/infrastructure.helper';

async function renderStep() {
  const latest = { current: EMPTY_INFRASTRUCTURE };
  function Host() {
    const [values, setValues] = useState<InfrastructureValues>(latest.current);
    return (
      <InfrastructureStep
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

describe('InfrastructureStep', () => {
  it('counts the machinery, the vehicles and the facilities, with the detail of "otros"', async () => {
    const latest = await renderStep();

    await fireEvent.changeText(screen.getByLabelText('Tractores'), '2');
    await fireEvent.changeText(screen.getByLabelText('Acoplados'), '1');
    await fireEvent.changeText(screen.getByLabelText('Corrales'), '4');
    await fireEvent.changeText(screen.getByLabelText('Detalle de "otros (1)"'), 'Enfardadora');

    expect(latest.current).toMatchObject({
      tractors: '2',
      trailers: '1',
      corrals: '4',
      otherMachinery1Detail: 'Enfardadora',
    });
  });

  it('asks where the farm sells', async () => {
    const latest = await renderStep();

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Ferias' }));

    expect(latest.current.commercializationChannels).toEqual(['ferias']);
  });
});

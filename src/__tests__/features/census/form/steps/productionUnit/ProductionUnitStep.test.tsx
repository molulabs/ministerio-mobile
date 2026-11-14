import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { useState } from 'react';

import { ProductionUnitStep } from '@/src/features/census/form/steps/productionUnit/ProductionUnitStep';
import {
  EMPTY_PRODUCTION_UNIT,
  type ProductionUnitValues,
} from '@/src/features/census/form/steps/productionUnit/productionUnit.helper';

// The localities live in the local database and the GPS on the phone, which tests do not open.
jest.mock('@/src/features/census/catalogs.queries', () => ({
  useLocalities: () => [],
}));
jest.mock('@/src/infrastructure/location/currentLocation', () => ({
  currentLocation: jest.fn(),
  requestLocationPermission: jest.fn(),
}));

/** The step as the wizard holds it, with what it was last given. */
async function renderStep(
  producerLivesOnFarm = false,
  initial: Partial<ProductionUnitValues> = {},
) {
  const latest = { current: { ...EMPTY_PRODUCTION_UNIT, ...initial } };
  function Host() {
    const [values, setValues] = useState(latest.current);
    return (
      <ProductionUnitStep
        values={values}
        producerLivesOnFarm={producerLivesOnFarm}
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

describe('ProductionUnitStep', () => {
  it('asks where the farm is when the producer does not live there', async () => {
    const latest = await renderStep();

    await fireEvent.changeText(screen.getByLabelText('Calle - Ruta (unidad productiva)'), 'Ruta 9');
    await fireEvent.changeText(screen.getByLabelText('Paraje'), 'Huacalera');

    expect(latest.current).toMatchObject({ street: 'Ruta 9', paraje: 'Huacalera' });
    expect(screen.getByRole('button', { name: 'Usar mi ubicación' })).toBeOnTheScreen();
  });

  it('does not ask again where the farm is when the producer lives there', async () => {
    await renderStep(true);

    expect(
      screen.getByText(
        'El productor vive en la finca: está en el domicilio cargado con sus datos.',
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('Calle - Ruta (unidad productiva)')).toBeNull();
    expect(screen.queryByLabelText('Latitud')).toBeNull();
  });

  it('warns when more hectares are produced than the farm has, without stopping', async () => {
    const latest = await renderStep(false, { totalHectares: '10' });

    await fireEvent.changeText(screen.getByLabelText('Hectáreas producidas'), '12');

    expect(screen.getByText('Las hectáreas producidas superan las totales')).toBeOnTheScreen();
    expect(latest.current.producedHectares).toBe('12');
  });

  it('asks the detail of the land tenure only for "otros"', async () => {
    const latest = await renderStep();

    expect(screen.queryByLabelText('Detalle de "otros" (tenencia)')).toBeNull();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Propietario' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Otros' }));
    await fireEvent.changeText(screen.getByLabelText('Detalle de "otros" (tenencia)'), 'Comodato');

    expect(latest.current).toMatchObject({
      landTenure: ['propietario', 'otros'],
      landTenureOtherDetail: 'Comodato',
    });
  });

  it('answers each service with Sí or No', async () => {
    const latest = await renderStep();

    await fireEvent.press(
      within(screen.getByLabelText('Internet')).getByRole('radio', { name: 'Sí' }),
    );
    await fireEvent.press(within(screen.getByLabelText('Gas')).getByRole('radio', { name: 'Sí' }));

    expect(latest.current).toMatchObject({ internet: true, gas: true, telephone: false });
  });
});

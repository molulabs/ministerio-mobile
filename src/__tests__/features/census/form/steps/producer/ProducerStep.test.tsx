import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useState } from 'react';

import { ProducerStep } from '@/src/features/census/form/steps/producer/ProducerStep';
import {
  EMPTY_FARM,
  EMPTY_PRODUCER,
  type FarmValues,
  type ProducerValues,
} from '@/src/features/census/form/steps/producer/producer.helper';

// The registered producers and the localities live in the local database, which tests do not open.
const mockSearchProducers = jest.fn();
const mockRegistered = new Map([
  ['30111222', { documentNumber: '30111222', fullName: 'Rosa Ficticia' }],
  ['30333444', { documentNumber: '30333444', fullName: 'Elsa Ensayo' }],
]);
const mockFarms = new Map([
  [
    '30333444',
    [
      {
        id: 7,
        number: 1,
        label: 'Finca 1 · 12.345.6.78901/01 · Yavi Chico',
        renspa: '12.345.6.78901/01',
        producerLivesOnFarm: true,
      },
      {
        id: 9,
        number: 2,
        label: 'Finca 2 · Sin RENSPA ni ubicación',
        renspa: null,
        producerLivesOnFarm: null,
      },
    ],
  ],
]);
jest.mock('@/src/features/census/catalogs.queries', () => ({
  searchProducers: (text: string) => mockSearchProducers(text),
  useRegisteredProducer: (documentNumber: string) => mockRegistered.get(documentNumber) ?? null,
  useProducerFarms: (documentNumber: string) => mockFarms.get(documentNumber) ?? [],
  useLocalities: (department: string) =>
    department === 'TILCARA' ? [{ id: 4, name: 'Maimará' }] : [],
}));
const mockCurrentLocation = jest.fn();
const mockRequestPermission = jest.fn();
jest.mock('@/src/infrastructure/location/currentLocation', () => ({
  currentLocation: () => mockCurrentLocation(),
  requestLocationPermission: () => mockRequestPermission(),
}));

type State = {
  producer: ProducerValues;
  farm: FarmValues;
  newFarm: boolean;
  farmId: number | null;
};

/** The step as the wizard holds it, with what it was last given. */
async function renderStep(initial: Partial<State> = {}) {
  const latest: { current: State } = {
    current: {
      producer: EMPTY_PRODUCER,
      farm: EMPTY_FARM,
      newFarm: false,
      farmId: null,
      ...initial,
    },
  };
  function Host() {
    const [state, setState] = useState(latest.current);
    return (
      <ProducerStep
        {...state}
        onChange={(patch) =>
          setState((current) => {
            latest.current = { ...current, ...patch };
            return latest.current;
          })
        }
      />
    );
  }
  await render(<Host />);
  return latest;
}

const rosa = { ...EMPTY_PRODUCER, fullName: 'Rosa Ficticia', documentNumber: '30111222' };
/** A producer the phone does not have: the census asks all their data. */
const juan = { ...EMPTY_PRODUCER, fullName: 'Juan Inventado', documentNumber: '99999999' };
/** A registered producer with two farms on the phone. */
const elsa = { ...EMPTY_PRODUCER, fullName: 'Elsa Ensayo', documentNumber: '30333444' };

describe('ProducerStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchProducers.mockResolvedValue([
      { documentNumber: '30111222', fullName: 'Rosa Ficticia' },
    ]);
  });

  it('finds a registered producer by the document and takes them', async () => {
    const latest = await renderStep();

    await fireEvent.press(screen.getByLabelText('DNI o CUIL'));
    await fireEvent.changeText(screen.getByRole('search'), '30111');
    await fireEvent.press(await screen.findByText('Rosa Ficticia'));

    expect(mockSearchProducers).toHaveBeenCalledWith('30111');
    expect(latest.current.producer).toMatchObject({
      fullName: 'Rosa Ficticia',
      documentNumber: '30111222',
    });
    expect(
      screen.getByText('Productor registrado: sus datos ya los tiene la oficina.'),
    ).toBeOnTheScreen();
    // Their document is the one the API knows them by: it is not edited.
    expect(screen.queryByLabelText('Número de documento')).toBeNull();
  });

  it('creates a producer from a document nobody has, with a CUIL by its 11 digits', async () => {
    mockSearchProducers.mockResolvedValue([]);
    const latest = await renderStep();

    await fireEvent.press(screen.getByLabelText('DNI o CUIL'));
    await fireEvent.changeText(screen.getByRole('search'), '20301112223');
    await fireEvent.press(await screen.findByText('Crear productor «20301112223»'));

    expect(latest.current.producer).toMatchObject({
      documentNumber: '20301112223',
      documentType: 'CUIL',
      nationality: 'Argentina',
    });
    expect(screen.getByText('Productor nuevo: se registra al enviar el censo.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Número de documento')).toBeOnTheScreen();
  });

  it('does not offer creating a producer whose document is registered', async () => {
    await renderStep();

    await fireEvent.press(screen.getByLabelText('DNI o CUIL'));
    await fireEvent.changeText(screen.getByRole('search'), '30111222');

    expect(await screen.findByText('Rosa Ficticia')).toBeOnTheScreen();
    expect(screen.queryByText('Crear productor «30111222»')).toBeNull();
  });

  it('searches with the numeric keyboard: a DNI or a CUIL', async () => {
    await renderStep();

    await fireEvent.press(screen.getByLabelText('DNI o CUIL'));

    expect(screen.getByRole('search').props.keyboardType).toBe('numeric');
  });

  it('does not search with fewer than 3 characters', async () => {
    await renderStep();

    await fireEvent.press(screen.getByLabelText('DNI o CUIL'));
    await fireEvent.changeText(screen.getByRole('search'), '30');

    expect(mockSearchProducers).not.toHaveBeenCalled();
  });

  it('asks only for the search until there is a producer', async () => {
    await renderStep();

    expect(screen.queryByLabelText('Apellido y nombre')).toBeNull();
    expect(screen.queryByText('Finca')).toBeNull();
  });

  it('shows a registered producer only by the name and the document, not editable', async () => {
    await renderStep({ producer: rosa });

    expect(screen.getByLabelText('Apellido y nombre')).toBeDisabled();
    expect(screen.getByLabelText('Apellido y nombre')).toHaveDisplayValue('Rosa Ficticia');
    expect(screen.getByLabelText('Documento')).toBeDisabled();
    expect(screen.queryByLabelText('CUIL')).toBeNull();
    expect(screen.queryByLabelText('Fecha de nacimiento')).toBeNull();
    expect(screen.queryByLabelText('Nacionalidad')).toBeNull();
  });

  it('does not ask a registered producer for the contact or the address', async () => {
    await renderStep({ producer: rosa });

    expect(screen.queryByText('Contacto')).toBeNull();
    expect(screen.queryByLabelText('Teléfono')).toBeNull();
    expect(screen.queryByLabelText('Calle - Ruta')).toBeNull();
    expect(screen.queryByLabelText('Departamento')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Usar mi ubicación' })).toBeNull();
    expect(screen.getByLabelText('RENSPA N°')).toBeOnTheScreen();
  });

  it('takes the office data when the typed document turns out registered', async () => {
    const latest = await renderStep({ producer: juan });
    await fireEvent.changeText(screen.getByLabelText('CUIL'), '20999999993');
    await fireEvent.changeText(screen.getByLabelText('Teléfono'), '388 4123456');
    await fireEvent.changeText(screen.getByLabelText('Calle - Ruta'), 'Belgrano');

    await fireEvent.changeText(screen.getByLabelText('Número de documento'), '30111222');

    await waitFor(() => expect(screen.queryByLabelText('Teléfono')).toBeNull());
    expect(latest.current.producer).toMatchObject({
      fullName: 'Rosa Ficticia',
      documentNumber: '30111222',
      cuil: '',
      phone: '',
      street: '',
    });
  });

  it('asks a new producer for the contact and the address', async () => {
    await renderStep({ producer: juan });

    expect(screen.getByLabelText('Teléfono')).toBeOnTheScreen();
    expect(screen.getByLabelText('Calle - Ruta')).toBeOnTheScreen();
    expect(screen.getByLabelText('Departamento')).toBeOnTheScreen();
  });

  it('asks which of the producer farms is censused before its RENSPA', async () => {
    await renderStep({ producer: elsa });

    expect(screen.getByText('Finca 1 · 12.345.6.78901/01 · Yavi Chico')).toBeOnTheScreen();
    expect(screen.getByText('Finca 2 · Sin RENSPA ni ubicación')).toBeOnTheScreen();
    expect(screen.getByText('Otra finca')).toBeOnTheScreen();
    expect(screen.queryByText('Es otra finca del productor')).toBeNull();
    expect(screen.queryByLabelText('RENSPA N°')).toBeNull();
  });

  it('fills the RENSPA and whether the producer lives there from the farm chosen', async () => {
    const latest = await renderStep({ producer: elsa });

    await fireEvent.press(screen.getByText('Finca 1 · 12.345.6.78901/01 · Yavi Chico'));

    expect(latest.current).toMatchObject({
      farmId: 7,
      newFarm: false,
      farm: { renspa: '12.345.6.78901/01', producerLivesOnFarm: true },
    });
    expect(screen.getByLabelText('RENSPA N°')).toHaveDisplayValue('12.345.6.78901/01');
  });

  it('starts another farm of the producer empty', async () => {
    const latest = await renderStep({ producer: elsa, farmId: 7 });

    await fireEvent.press(screen.getByText('Otra finca'));

    expect(latest.current).toMatchObject({ farmId: null, newFarm: true, farm: EMPTY_FARM });
  });

  it('starts the farm over when another producer is chosen', async () => {
    const latest = await renderStep({ producer: elsa, newFarm: true, farmId: 7 });

    await fireEvent.press(screen.getByLabelText('DNI o CUIL'));
    await fireEvent.changeText(screen.getByRole('search'), 'Juan');
    await fireEvent.press(await screen.findByText('Crear productor «Juan»'));

    expect(latest.current.producer.fullName).toBe('Juan');
    expect(latest.current.newFarm).toBe(false);
    expect(latest.current.farmId).toBeNull();
  });

  it('asks whether it is another farm only of a registered producer', async () => {
    const latest = await renderStep({ producer: rosa });

    await fireEvent.press(screen.getByRole('checkbox'));
    expect(latest.current.newFarm).toBe(true);

    await renderStep({ producer: { ...rosa, documentNumber: '99999999' } });
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('keeps the RENSPA and whether the producer lives on the farm', async () => {
    const latest = await renderStep({ producer: rosa });

    await fireEvent.changeText(screen.getByLabelText('RENSPA N°'), '01.234.5');
    await fireEvent.press(screen.getByRole('radio', { name: 'Sí' }));

    expect(latest.current.farm).toEqual({ renspa: '01.234.5', producerLivesOnFarm: true });
  });

  it('picks the locality among the department ones, after the department', async () => {
    const latest = await renderStep({ producer: juan });

    expect(screen.getByText('Elegí primero el departamento.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Departamento'));
    await fireEvent.press(screen.getByText('Tilcara'));
    await fireEvent.press(screen.getByLabelText('Localidad'));
    await fireEvent.press(await screen.findByText('Maimará'));

    expect(latest.current.producer).toMatchObject({ department: 'TILCARA', locality: 4 });
  });

  it('adds a locality the phone does not have by its name', async () => {
    const latest = await renderStep({ producer: { ...juan, department: 'TILCARA' } });

    await fireEvent.press(screen.getByLabelText('Localidad'));
    await fireEvent.changeText(screen.getByRole('search'), 'El Moreno');
    await fireEvent.press(await screen.findByText('Agregar localidad «El Moreno»'));

    expect(latest.current.producer.locality).toEqual({ name: 'El Moreno' });
    expect(screen.getByText('Localidad nueva: se agrega al enviar el censo.')).toBeOnTheScreen();
  });

  it('fills the coordinates from the GPS', async () => {
    mockRequestPermission.mockResolvedValue(true);
    mockCurrentLocation.mockResolvedValue({
      coords: { latitude: -23.5873214, longitude: -65.39642 },
      timestamp: 0,
    });
    const latest = await renderStep({ producer: juan });

    await fireEvent.press(screen.getByRole('button', { name: 'Usar mi ubicación' }));

    await waitFor(() =>
      expect(latest.current.producer).toMatchObject({
        latitude: '-23.587321',
        longitude: '-65.396420',
      }),
    );
  });

  it('says so when the location is not allowed', async () => {
    mockRequestPermission.mockResolvedValue(false);
    await renderStep({ producer: juan });

    await fireEvent.press(screen.getByRole('button', { name: 'Usar mi ubicación' }));

    expect(
      await screen.findByText('Sin permiso de ubicación. Habilitalo en los ajustes del teléfono.'),
    ).toBeOnTheScreen();
    expect(mockCurrentLocation).not.toHaveBeenCalled();
  });
});

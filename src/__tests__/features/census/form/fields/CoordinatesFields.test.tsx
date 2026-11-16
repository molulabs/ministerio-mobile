import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { CoordinatesFields } from '@/src/features/census/form/fields/CoordinatesFields';
import {
  LocationPickerContext,
  type LocationPickerProps,
} from '@/src/features/census/form/fields/locationPicker.context';

jest.mock('@/src/infrastructure/location/currentLocation', () => ({
  currentLocation: jest.fn(),
  requestLocationPermission: jest.fn(),
}));

/** A map that only says where it opened. */
const picker = jest.fn((props: LocationPickerProps) => (
  <Text>map at {props.initial ? props.initial.join(' ') : 'Jujuy'}</Text>
));
const pickerProps = () => picker.mock.lastCall![0];

describe('CoordinatesFields', () => {
  const onChange = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  const renderFields = (latitude = '', longitude = '') =>
    render(
      <LocationPickerContext.Provider value={picker}>
        <CoordinatesFields latitude={latitude} longitude={longitude} onChange={onChange} />
      </LocationPickerContext.Provider>,
    );

  it('chooses the coordinates on the map', async () => {
    await renderFields();

    await fireEvent.press(screen.getByRole('button', { name: 'Elegir en el mapa' }));
    expect(screen.getByText('map at Jujuy')).toBeOnTheScreen();
    await act(async () => pickerProps().onConfirm([-65.2975, -24.1852]));

    expect(onChange).toHaveBeenCalledWith('-24.185200', '-65.297500');
    expect(screen.queryByText('map at Jujuy')).toBeNull();
  });

  it('opens the map on the typed coordinates', async () => {
    await renderFields('-24.1852', '-65.2975');

    await fireEvent.press(screen.getByRole('button', { name: 'Elegir en el mapa' }));

    expect(screen.getByText('map at -65.2975 -24.1852')).toBeOnTheScreen();
  });

  it('keeps the coordinates when the map is cancelled', async () => {
    await renderFields('-24.1852', '-65.2975');
    await fireEvent.press(screen.getByRole('button', { name: 'Elegir en el mapa' }));

    await act(async () => pickerProps().onCancel());

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText(/map at/)).toBeNull();
  });

  it('offers no map when the app gives none', async () => {
    await render(<CoordinatesFields latitude="" longitude="" onChange={onChange} />);

    expect(screen.queryByRole('button', { name: 'Elegir en el mapa' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Usar mi ubicación' })).toBeOnTheScreen();
  });
});

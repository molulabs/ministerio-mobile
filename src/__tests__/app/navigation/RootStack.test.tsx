import { ToastProvider } from '@molulabs/ds';
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { RootStack } from '@/src/app/navigation/RootStack';

type MockState = {
  status: 'signedOut' | 'signedIn';
  user: { id: number; firstname: string; lastname: string; email: string } | null;
  mode: 'online' | 'offline' | null;
  signedOutReason: null;
  signIn: jest.Mock;
  signOut: jest.Mock;
};

let mockState: MockState;

jest.mock('@/src/features/auth/session.store', () => ({
  useSession: (select: (state: MockState) => unknown) => select(mockState),
}));

// The tabs read the sync state from the local database, which tests do not open.
let mockSyncState: Record<string, string>;

jest.mock('@/src/infrastructure/sync/syncState', () => ({
  syncKeys: { lastSyncAt: 'lastSyncAt', catalogsSyncedAt: 'catalogsSyncedAt' },
  useSyncState: (key: string) => mockSyncState[key] ?? null,
}));

// The sync engine brings the API client and the database along; the tabs only ask it to send.
const mockSendCensusesNow = jest.fn();
jest.mock('@/src/app/sync', () => ({ sendCensusesNow: () => mockSendCensusesNow() }));
// The censuses live in the local database, which tests do not open: one is waiting to be sent.
jest.mock('@/src/features/census/census.repository', () => ({
  saveReadyCensus: jest.fn(),
  useCensuses: () => [
    {
      id: '01a1d70a-496a-7a5e-bf6a-29b1b22455f3',
      status: 'ready',
      producer: 'Productor de prueba',
      document: 'DNI 99000001',
      date: '2026-11-13',
      errors: [],
      conflict: null,
    },
  ],
}));

// The map is native (MapLibre) and reads its packages from the database: none installed here.
jest.mock('@maplibre/maplibre-react-native', () => ({}));
jest.mock('@/src/features/maps/useOfflineMap', () => ({
  useOfflineMap: () => ({ map: null, error: false }),
}));

const rosa = { id: 7, firstname: 'Rosa', lastname: 'Mendieta', email: 'rosa@company.com' };

function renderNavigation() {
  // App.tsx puts the toasts above the navigation.
  return render(
    <ToastProvider>
      <NavigationContainer>
        <RootStack />
      </NavigationContainer>
    </ToastProvider>,
  );
}

describe('RootStack', () => {
  beforeEach(() => {
    mockSyncState = {};
    mockState = {
      status: 'signedOut',
      user: null,
      mode: null,
      signedOutReason: null,
      signIn: jest.fn(),
      signOut: jest.fn(),
    };
  });

  it('shows only the login when signed out', async () => {
    await renderNavigation();

    expect(screen.getByText('Censo de productores')).toBeOnTheScreen();
    expect(screen.queryByText('Perfil')).not.toBeOnTheScreen();
  });

  it('opens on the home tab when signed in', async () => {
    mockState = { ...mockState, status: 'signedIn', user: rosa, mode: 'online' };
    await renderNavigation();

    expect(screen.getByText('¡Hola, Rosa!')).toBeOnTheScreen();
    expect(screen.queryByText('Censo de productores')).not.toBeOnTheScreen();
  });

  it('warns on the home tab while the offline data was never downloaded', async () => {
    mockState = { ...mockState, status: 'signedIn', user: rosa, mode: 'online' };
    await renderNavigation();

    expect(screen.getByText('Faltan los datos para trabajar sin conexión')).toBeOnTheScreen();
  });

  it('does not warn once the offline data was downloaded', async () => {
    mockState = { ...mockState, status: 'signedIn', user: rosa, mode: 'online' };
    mockSyncState = { catalogsSyncedAt: '1000' };
    await renderNavigation();

    expect(screen.queryByText('Faltan los datos para trabajar sin conexión')).not.toBeOnTheScreen();
  });

  it('moves between the tabs', async () => {
    mockState = { ...mockState, status: 'signedIn', user: rosa, mode: 'online' };
    await renderNavigation();

    await fireEvent.press(screen.getByRole('tab', { name: 'Censos' }));
    expect(screen.getByText('Productor de prueba')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Mapa' }));
    expect(screen.getByText(/mapa de Jujuy/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Perfil' }));
    expect(screen.getByText('Hola, Rosa')).toBeOnTheScreen();
  });

  it('sends the censuses from the census tab and says what happened', async () => {
    mockState = { ...mockState, status: 'signedIn', user: rosa, mode: 'online' };
    mockSendCensusesNow.mockResolvedValue({
      sent: 2,
      inReview: 0,
      needsFix: 0,
      anomalies: 0,
      waiting: 0,
    });
    await renderNavigation();

    await fireEvent.press(screen.getByRole('tab', { name: 'Censos' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar censos' }));

    expect(await screen.findByText('Se enviaron 2 censos')).toBeOnTheScreen();
  });

  it('signs out from the profile tab', async () => {
    mockState = { ...mockState, status: 'signedIn', user: rosa, mode: 'online' };
    await renderNavigation();

    await fireEvent.press(screen.getByRole('tab', { name: 'Perfil' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(mockState.signOut).toHaveBeenCalled();
  });
});

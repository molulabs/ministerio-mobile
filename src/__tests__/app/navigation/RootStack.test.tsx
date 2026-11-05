import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { RootStack } from '@/src/app/navigation/RootStack';

type MockState = {
  status: 'signedOut' | 'signedIn';
  user: { firstname: string; lastname: string; email: string } | null;
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
jest.mock('@/src/infrastructure/sync/syncState', () => ({
  syncKeys: { lastSyncAt: 'lastSyncAt' },
  useSyncState: () => null,
}));

const rosa = { firstname: 'Rosa', lastname: 'Mendieta', email: 'rosa@company.com' };

function renderNavigation() {
  return render(
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>,
  );
}

describe('RootStack', () => {
  beforeEach(() => {
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

    expect(screen.getByText('Iniciar sesión')).toBeOnTheScreen();
    expect(screen.queryByText('Perfil')).not.toBeOnTheScreen();
  });

  it('opens on the census tab when signed in', async () => {
    mockState = { ...mockState, status: 'signedIn', user: rosa, mode: 'online' };
    await renderNavigation();

    expect(screen.getByText(/Acá vas a ver tus censos/)).toBeOnTheScreen();
    expect(screen.queryByText('Iniciar sesión')).not.toBeOnTheScreen();
  });

  it('moves between the tabs', async () => {
    mockState = { ...mockState, status: 'signedIn', user: rosa, mode: 'online' };
    await renderNavigation();

    await fireEvent.press(screen.getByRole('button', { name: /^Mapa/ }));
    expect(screen.getByText(/mapa de Jujuy/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: /^Perfil/ }));
    expect(screen.getByText('Hola, Rosa')).toBeOnTheScreen();
  });

  it('signs out from the profile tab', async () => {
    mockState = { ...mockState, status: 'signedIn', user: rosa, mode: 'online' };
    await renderNavigation();

    await fireEvent.press(screen.getByRole('button', { name: /^Perfil/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Salir' }));

    expect(mockState.signOut).toHaveBeenCalled();
  });
});

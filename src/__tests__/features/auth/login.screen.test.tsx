import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { SignInError } from '@/src/features/auth/auth.model';
import { LoginScreen } from '@/src/features/auth/screens/login.screen';

const mockSignIn = jest.fn();
let mockExpired = false;

// The screen only needs signIn and expired: the real store would bring the API client along.
jest.mock('@/src/features/auth/session.store', () => ({
  useSession: (select: (state: unknown) => unknown) =>
    select({ signIn: mockSignIn, expired: mockExpired }),
}));

async function fillAndSubmit(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('Email'), email);
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), password);
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginScreen', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockExpired = false;
  });

  it('asks for the email and the password before calling the API', async () => {
    await render(<LoginScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('El email es obligatorio')).toBeOnTheScreen();
    expect(screen.getByText('La contraseña es obligatoria')).toBeOnTheScreen();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    await render(<LoginScreen />);

    await fillAndSubmit('rosa@', 'password');

    expect(await screen.findByText('Ingresá un email válido')).toBeOnTheScreen();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('signs in with the trimmed email', async () => {
    mockSignIn.mockResolvedValue(undefined);
    await render(<LoginScreen />);

    await fillAndSubmit('  rosa@company.com ', 'password');

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('rosa@company.com', 'password'));
  });

  it.each([
    ['invalid_credentials', 'Email o contraseña incorrectos.'],
    ['cannot_take_censuses', 'Este usuario no puede cargar censos. Usá una cuenta de censista.'],
    ['network', 'No se pudo conectar con el servidor. Revisá la conexión e intentá de nuevo.'],
  ] as const)('shows why the sign-in failed (%s)', async (kind, message) => {
    mockSignIn.mockRejectedValue(new SignInError(kind));
    await render(<LoginScreen />);

    await fillAndSubmit('rosa@company.com', 'password');

    expect(await screen.findByText(message)).toBeOnTheScreen();
  });

  it('says the session expired when it did', async () => {
    mockExpired = true;
    await render(<LoginScreen />);

    expect(screen.getByText('Tu sesión expiró. Iniciá sesión de nuevo.')).toBeOnTheScreen();
  });
});

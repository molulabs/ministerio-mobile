import { ToastProvider } from '@molulabs/ds';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { SignInError } from '@/src/features/auth/auth.model';
import { LoginScreen } from '@/src/features/auth/screens/login.screen';

const mockSignIn = jest.fn();
let mockSignedOutReason: 'expired' | 'offline_expired' | null = null;

// The screen only needs signIn and signedOutReason: the real store would bring the API client along.
jest.mock('@/src/features/auth/session.store', () => ({
  useSession: (select: (state: unknown) => unknown) =>
    select({ signIn: mockSignIn, signedOutReason: mockSignedOutReason }),
}));

// The error of a failed sign-in shows in a toast, as on the web.
function renderLogin() {
  return render(
    <ToastProvider>
      <LoginScreen />
    </ToastProvider>,
  );
}

async function fillAndSubmit(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('Email'), email);
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), password);
  await fireEvent.press(screen.getByRole('button', { name: 'Ingresar' }));
}

describe('LoginScreen', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockSignedOutReason = null;
  });

  it('asks for the email and the password before calling the API', async () => {
    await renderLogin();

    await fireEvent.press(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('El email es obligatorio')).toBeOnTheScreen();
    expect(screen.getByText('La contraseña es obligatoria')).toBeOnTheScreen();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    await renderLogin();

    await fillAndSubmit('rosa@', 'password');

    expect(await screen.findByText('Ingresá un email válido')).toBeOnTheScreen();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('signs in with the trimmed email', async () => {
    mockSignIn.mockResolvedValue(undefined);
    await renderLogin();

    await fillAndSubmit('  rosa@company.com ', 'password');

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('rosa@company.com', 'password'));
  });

  it.each([
    ['invalid_credentials', 'Email o contraseña incorrectos.'],
    ['cannot_take_censuses', 'Este usuario no puede cargar censos. Usá una cuenta de censista.'],
    [
      'offline_no_credential',
      'Sin conexión, y este usuario nunca inició sesión en este teléfono. Conectate para entrar por primera vez.',
    ],
    [
      'offline_expired',
      'Pasaron más de 7 días sin conexión con el servidor. Conectate para iniciar sesión.',
    ],
    ['offline_locked', 'Demasiados intentos fallidos sin conexión. Conectate para iniciar sesión.'],
    [
      'offline_clock',
      'La fecha del teléfono parece incorrecta. Corregila o conectate para iniciar sesión.',
    ],
  ] as const)('shows why the sign-in failed (%s)', async (kind, message) => {
    mockSignIn.mockRejectedValue(new SignInError(kind));
    await renderLogin();

    await fillAndSubmit('rosa@company.com', 'password');

    expect(await screen.findByText(message)).toBeOnTheScreen();
  });

  it.each([
    [3, 'Email o contraseña incorrectos. Sin conexión te quedan 3 intentos.'],
    [1, 'Email o contraseña incorrectos. Sin conexión te queda 1 intento.'],
  ])('tells how many offline attempts are left (%i)', async (remaining, message) => {
    mockSignIn.mockRejectedValue(new SignInError('offline_wrong_password', remaining));
    await renderLogin();

    await fillAndSubmit('rosa@company.com', 'mala');

    expect(await screen.findByText(message)).toBeOnTheScreen();
  });

  it('says the 7 days without signal are over when they are', async () => {
    mockSignedOutReason = 'offline_expired';
    await renderLogin();

    expect(
      screen.getByText(
        'Pasaron más de 7 días sin conexión con el servidor. Conectate para iniciar sesión.',
      ),
    ).toBeOnTheScreen();
  });

  it('says the session expired when it did', async () => {
    mockSignedOutReason = 'expired';
    await renderLogin();

    expect(screen.getByText('Tu sesión expiró. Iniciá sesión de nuevo.')).toBeOnTheScreen();
  });
});

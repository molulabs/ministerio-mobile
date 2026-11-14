import { ToastProvider } from '@molulabs/ds';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { CensusFormScreen } from '@/src/features/census/form/census-form.screen';

// The drafts live in the local database, which tests do not open.
const mockGetDraft = jest.fn();
const mockSaveDraft = jest.fn();
const mockFinishDraft = jest.fn();
const mockDiscardDraft = jest.fn();
jest.mock('@/src/features/census/census.repository', () => ({
  getDraft: (...args: unknown[]) => mockGetDraft(...args),
  saveDraft: (...args: unknown[]) => mockSaveDraft(...args),
  finishDraft: (...args: unknown[]) => mockFinishDraft(...args),
  discardDraft: (...args: unknown[]) => mockDiscardDraft(...args),
}));

const ID = '01a1d70a-496a-7a5e-bf6a-29b1b22455f3';
const producer = { fullName: 'Rosa Quispe', documentType: 'DNI', documentNumber: '30111222' };

const draft = (payload: Record<string, unknown> = {}, formStep: number | null = 0) => ({
  payload: {
    schemaVersion: 2,
    date: '2026-11-13',
    formNumber: null,
    observations: null,
    ...payload,
  },
  formStep,
});

async function renderForm(onClose = jest.fn()) {
  await render(
    <ToastProvider>
      <CensusFormScreen id={ID} userId={7} onClose={onClose} />
    </ToastProvider>,
  );
  return onClose;
}

describe('CensusFormScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveDraft.mockResolvedValue(undefined);
    mockFinishDraft.mockResolvedValue(undefined);
    mockDiscardDraft.mockResolvedValue(undefined);
  });

  it('opens a draft on the step it was left on', async () => {
    mockGetDraft.mockResolvedValue(draft({}, 3));
    await renderForm();

    expect(await screen.findByText('Paso 4 de 8')).toBeOnTheScreen();
    expect(screen.getByText('Pecuaria')).toBeOnTheScreen();
    expect(mockGetDraft).toHaveBeenCalledWith(ID, 7);
  });

  it('starts with the date and the form number of the census', async () => {
    mockGetDraft.mockResolvedValue(draft({ formNumber: 'F-12' }));
    await renderForm();

    expect(await screen.findByDisplayValue('13/11/2026')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('F-12')).toBeOnTheScreen();
  });

  it('says so when the census is no longer a draft', async () => {
    mockGetDraft.mockResolvedValue(null);
    await renderForm();

    expect(await screen.findByText('Este censo ya no es un borrador.')).toBeOnTheScreen();
  });

  it('saves the draft with what was typed and the step it moved to', async () => {
    mockGetDraft.mockResolvedValue(draft());
    await renderForm();

    await fireEvent.changeText(await screen.findByLabelText('N° de formulario'), 'F-99');
    await fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() =>
      expect(mockSaveDraft).toHaveBeenLastCalledWith(
        ID,
        7,
        expect.objectContaining({ formNumber: 'F-99', schemaVersion: 2 }),
        1,
      ),
    );
    expect(screen.getByText('Familia y finanzas')).toBeOnTheScreen();
  });

  it('does not finish without the producer, and says what is missing', async () => {
    mockGetDraft.mockResolvedValue(draft({}, 7));
    const onClose = await renderForm();

    await fireEvent.press(await screen.findByRole('button', { name: 'Terminar censo' }));

    expect(screen.getByText('El nombre y el documento del productor.')).toBeOnTheScreen();
    expect(mockFinishDraft).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('finishes a census with the producer, with its observations', async () => {
    mockGetDraft.mockResolvedValue(draft({ producer }, 7));
    const onClose = await renderForm();

    await fireEvent.changeText(await screen.findByLabelText('Observaciones'), 'Sin novedades');
    await fireEvent.press(screen.getByRole('button', { name: 'Terminar censo' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockFinishDraft).toHaveBeenCalledWith(
      ID,
      7,
      expect.objectContaining({ producer, observations: 'Sin novedades' }),
    );
    expect(screen.getByText('Censo listo para enviar')).toBeOnTheScreen();
  });

  it('discards the draft only after asking', async () => {
    mockGetDraft.mockResolvedValue(draft());
    const onClose = await renderForm();

    await fireEvent.press(await screen.findByRole('button', { name: 'Descartar' }));
    expect(screen.getByText('¿Descartar este censo?')).toBeOnTheScreen();
    expect(mockDiscardDraft).not.toHaveBeenCalled();

    // The dialog's confirm button: the bar's action has the same name.
    const buttons = screen.getAllByRole('button', { name: 'Descartar' });
    await fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockDiscardDraft).toHaveBeenCalledWith(ID, 7);
  });
});

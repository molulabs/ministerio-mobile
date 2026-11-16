import { ToastProvider } from '@molulabs/ds';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { CensusListItem } from '@/src/features/census/list/censusList';
import { CensusListScreen } from '@/src/features/census/list/census-list.screen';

const census = (change: Partial<CensusListItem>): CensusListItem => ({
  id: '01a1d70a-496a-7a5e-bf6a-29b1b22455f3',
  status: 'ready',
  producer: 'Rosa Ficticia',
  document: 'DNI 30111222',
  date: '2026-11-13',
  errors: [],
  conflict: null,
  ...change,
});

const nothingSent = { sent: 0, inReview: 0, needsFix: 0, anomalies: 0, waiting: 0 };

const mockNewCensus = jest.fn().mockResolvedValue(undefined);
const mockOpenDraft = jest.fn();
const mockFix = jest.fn().mockResolvedValue(undefined);

function renderScreen(
  censuses: CensusListItem[],
  onSend = jest.fn().mockResolvedValue(nothingSent),
) {
  return render(
    <ToastProvider>
      <CensusListScreen
        censuses={censuses}
        offlineDataMissing={false}
        onNewCensus={mockNewCensus}
        onOpenDraft={mockOpenDraft}
        onFix={mockFix}
        onSend={onSend}
      />
    </ToastProvider>,
  );
}

describe('CensusListScreen', () => {
  it('says there are no censuses yet, with nothing to send', async () => {
    await renderScreen([]);

    expect(screen.getByText('Todavía no hay censos')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Enviar censos' })).toBeNull();
  });

  it('lists each census with its producer, document, date and state, by group', async () => {
    await renderScreen([
      census({ id: '3', status: 'sent', producer: 'Hugo Ejemplo', document: 'DNI 25000111' }),
      census({ id: '2', status: 'ready' }),
      census({ id: '1', status: 'needs_fix', producer: null, document: null, date: null }),
    ]);

    expect(screen.getByText('Para revisar')).toBeOnTheScreen();
    expect(screen.getByText('Pendientes de envío')).toBeOnTheScreen();
    expect(screen.getByText('Enviados')).toBeOnTheScreen();
    expect(screen.getByText('Rosa Ficticia')).toBeOnTheScreen();
    expect(screen.getByText('DNI 30111222 · 13/11/2026')).toBeOnTheScreen();
    expect(screen.getByText('Pendiente')).toBeOnTheScreen();
    expect(screen.getByText('Hugo Ejemplo')).toBeOnTheScreen();
    expect(screen.getByText('Enviado')).toBeOnTheScreen();
    expect(screen.getByText('Productor sin nombre')).toBeOnTheScreen();
    expect(screen.getByText('A corregir')).toBeOnTheScreen();
  });

  it('sends when there are pending censuses and says what happened', async () => {
    const onSend = jest.fn().mockResolvedValue({ ...nothingSent, sent: 1 });
    await renderScreen([census({})], onSend);

    await fireEvent.press(screen.getByRole('button', { name: 'Enviar censos' }));

    expect(onSend).toHaveBeenCalled();
    expect(await screen.findByText('Se envió 1 censo')).toBeOnTheScreen();
  });

  it('has nothing to send when every census already went out', async () => {
    await renderScreen([census({ status: 'sent' })]);

    expect(screen.queryByRole('button', { name: 'Enviar censos' })).toBeNull();
  });

  it('shows the fields the API rejected', async () => {
    await renderScreen([
      census({
        status: 'needs_fix',
        errors: [{ field: 'producer.fullName', message: 'Este valor no debería estar vacío.' }],
      }),
    ]);

    await fireEvent.press(screen.getByRole('button', { name: /Rosa Ficticia/ }));

    expect(screen.getByText('Datos para corregir')).toBeOnTheScreen();
    expect(screen.getByText('Este valor no debería estar vacío.')).toBeOnTheScreen();
    expect(screen.getByText('producer.fullName')).toBeOnTheScreen();
  });

  it('reopens a census to fix on the phone', async () => {
    await renderScreen([
      census({
        status: 'needs_fix',
        errors: [{ field: 'producer.fullName', message: 'Este valor no debería estar vacío.' }],
      }),
    ]);

    await fireEvent.press(screen.getByRole('button', { name: /Rosa Ficticia/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Corregir' }));

    expect(mockFix).toHaveBeenCalledWith('01a1d70a-496a-7a5e-bf6a-29b1b22455f3');
  });

  it('offers nothing to fix for a census the API refused', async () => {
    await renderScreen([census({ status: 'anomaly' })]);

    await fireEvent.press(screen.getByRole('button', { name: /Rosa Ficticia/ }));

    expect(screen.queryByRole('button', { name: 'Corregir' })).toBeNull();
  });

  it('tells a census being fixed from a new draft, and opens it', async () => {
    await renderScreen([
      census({
        status: 'draft',
        errors: [{ field: 'producer.fullName', message: 'Este valor no debería estar vacío.' }],
      }),
    ]);

    expect(screen.getByText('Borradores')).toBeOnTheScreen();
    expect(screen.getByText('A corregir')).toBeOnTheScreen();
    expect(screen.queryByText('Borrador')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: /Rosa Ficticia/ }));
    expect(mockOpenDraft).toHaveBeenCalledWith('01a1d70a-496a-7a5e-bf6a-29b1b22455f3');
  });

  it('says a census the API refused is not sent again', async () => {
    await renderScreen([census({ status: 'anomaly' })]);

    await fireEvent.press(screen.getByRole('button', { name: /Rosa Ficticia/ }));

    expect(screen.getByText('No se pudo registrar')).toBeOnTheScreen();
    expect(screen.getByText(/no se vuelve a enviar/)).toBeOnTheScreen();
  });

  it('shows what the office has to review', async () => {
    await renderScreen([
      census({ status: 'in_review', conflict: 'El productor ya tiene otra finca con ese RENSPA.' }),
    ]);

    await fireEvent.press(screen.getByRole('button', { name: /Rosa Ficticia/ }));

    expect(screen.getByText('Enviado, en revisión')).toBeOnTheScreen();
    expect(screen.getByText('El productor ya tiene otra finca con ese RENSPA.')).toBeOnTheScreen();
  });

  it('does not open a census that has nothing more to show', async () => {
    await renderScreen([census({ status: 'sent' })]);

    expect(screen.queryByRole('button', { name: /Rosa Ficticia/ })).toBeNull();
  });
  it('starts a census', async () => {
    await renderScreen([]);

    await fireEvent.press(screen.getByRole('button', { name: 'Nuevo censo' }));

    expect(mockNewCensus).toHaveBeenCalled();
  });

  it('lists the drafts and opens one where it was left', async () => {
    await renderScreen([census({ status: 'draft', producer: null, document: null })]);

    expect(screen.getByText('Borradores')).toBeOnTheScreen();
    expect(screen.getByText('Borrador')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: /Productor sin nombre/ }));

    expect(mockOpenDraft).toHaveBeenCalledWith('01a1d70a-496a-7a5e-bf6a-29b1b22455f3');
  });

  it('warns when the offline data was never downloaded', async () => {
    await render(
      <ToastProvider>
        <CensusListScreen
          censuses={[]}
          offlineDataMissing
          onNewCensus={mockNewCensus}
          onOpenDraft={mockOpenDraft}
          onFix={mockFix}
          onSend={jest.fn()}
        />
      </ToastProvider>,
    );

    expect(screen.getByText('Faltan los datos para trabajar sin conexión')).toBeOnTheScreen();
  });
});

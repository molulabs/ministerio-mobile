import { ToastProvider } from '@molulabs/ds';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { CensusListItem } from '@/src/features/census/censusList';
import { CensusListScreen } from '@/src/features/census/screens/census-list.screen';

const census = (change: Partial<CensusListItem>): CensusListItem => ({
  id: '01a1d70a-496a-7a5e-bf6a-29b1b22455f3',
  status: 'ready',
  producer: 'Rosa Quispe',
  document: 'DNI 30111222',
  date: '2026-11-13',
  errors: [],
  conflict: null,
  ...change,
});

const nothingSent = { sent: 0, inReview: 0, needsFix: 0, anomalies: 0, waiting: 0 };

function renderScreen(
  censuses: CensusListItem[],
  onSend = jest.fn().mockResolvedValue(nothingSent),
) {
  return render(
    <ToastProvider>
      <CensusListScreen censuses={censuses} onSend={onSend} />
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
      census({ id: '3', status: 'sent', producer: 'Hugo Cruz', document: 'DNI 25000111' }),
      census({ id: '2', status: 'ready' }),
      census({ id: '1', status: 'needs_fix', producer: null, document: null, date: null }),
    ]);

    expect(screen.getByText('Para revisar')).toBeOnTheScreen();
    expect(screen.getByText('Pendientes de envío')).toBeOnTheScreen();
    expect(screen.getByText('Enviados')).toBeOnTheScreen();
    expect(screen.getByText('Rosa Quispe')).toBeOnTheScreen();
    expect(screen.getByText('DNI 30111222 · 13/11/2026')).toBeOnTheScreen();
    expect(screen.getByText('Pendiente')).toBeOnTheScreen();
    expect(screen.getByText('Hugo Cruz')).toBeOnTheScreen();
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

    await fireEvent.press(screen.getByRole('button', { name: /Rosa Quispe/ }));

    expect(screen.getByText('Datos para corregir')).toBeOnTheScreen();
    expect(screen.getByText('Este valor no debería estar vacío.')).toBeOnTheScreen();
    expect(screen.getByText('producer.fullName')).toBeOnTheScreen();
  });

  it('says a census the API refused is not sent again', async () => {
    await renderScreen([census({ status: 'anomaly' })]);

    await fireEvent.press(screen.getByRole('button', { name: /Rosa Quispe/ }));

    expect(screen.getByText('No se pudo registrar')).toBeOnTheScreen();
    expect(screen.getByText(/no se vuelve a enviar/)).toBeOnTheScreen();
  });

  it('shows what the office has to review', async () => {
    await renderScreen([
      census({ status: 'in_review', conflict: 'El productor ya tiene otra finca con ese RENSPA.' }),
    ]);

    await fireEvent.press(screen.getByRole('button', { name: /Rosa Quispe/ }));

    expect(screen.getByText('Enviado, en revisión')).toBeOnTheScreen();
    expect(screen.getByText('El productor ya tiene otra finca con ese RENSPA.')).toBeOnTheScreen();
  });

  it('does not open a census that has nothing more to show', async () => {
    await renderScreen([census({ status: 'sent' })]);

    expect(screen.queryByRole('button', { name: /Rosa Quispe/ })).toBeNull();
  });
});

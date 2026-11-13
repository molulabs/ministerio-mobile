import { sendSummary } from '@/src/features/census/list/sendSummary';
import type { SendResult } from '@/src/infrastructure/sync/outbox.sender';

const result = (counts: Partial<SendResult>): SendResult => ({
  sent: 0,
  inReview: 0,
  needsFix: 0,
  anomalies: 0,
  waiting: 0,
  ...counts,
});

describe('sendSummary', () => {
  it('says there was nothing to send', () => {
    expect(sendSummary(result({}))).toEqual({ tone: 'info', title: 'No hay censos para enviar' });
  });

  it('counts the censuses in review as sent: nothing is left to do on the phone', () => {
    expect(sendSummary(result({ sent: 2, inReview: 1 }))).toEqual({
      tone: 'success',
      title: 'Se enviaron 3 censos',
      message: undefined,
    });
  });

  it('says so when nothing went out for lack of signal', () => {
    expect(sendSummary(result({ waiting: 1 }))).toEqual({
      tone: 'warning',
      title: 'No se pudo enviar',
      message: 'Quedó 1 censo sin enviar. Se vuelve a intentar cuando haya señal.',
    });
  });

  it('tells what is left to do next to what was sent', () => {
    expect(sendSummary(result({ sent: 1, needsFix: 2, anomalies: 1, waiting: 3 }))).toEqual({
      tone: 'warning',
      title: 'Se envió 1 censo',
      message:
        '2 censos tienen datos para corregir. 1 censo no se pudo registrar. Avisá a la oficina. Quedaron 3 censos sin enviar. Se vuelve a intentar cuando haya señal.',
    });
  });

  it('points at the censuses to check when none was sent', () => {
    expect(sendSummary(result({ needsFix: 1 }))).toEqual({
      tone: 'warning',
      title: 'Hay censos para revisar',
      message: '1 censo tiene datos para corregir.',
    });
  });

  it('asks for an online sign-in when the session has no tokens', () => {
    expect(sendSummary('skipped')).toMatchObject({ tone: 'warning', title: 'No se puede enviar' });
  });

  it('says the send failed when the phone could not read its censuses', () => {
    expect(sendSummary('failed')).toMatchObject({ tone: 'danger', title: 'No se pudo enviar' });
  });
});

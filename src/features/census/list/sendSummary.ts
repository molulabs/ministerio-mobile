import type { SendOutcome } from '@/src/infrastructure/sync/syncEngine';
import { texts } from '@/src/shared/constants/texts';

export type SendSummary = {
  tone: 'success' | 'info' | 'warning' | 'danger';
  title: string;
  message?: string;
};

/** What to tell the census taker after they asked to send their censuses. */
export function sendSummary(outcome: SendOutcome): SendSummary {
  const t = texts.census.send;

  if (outcome === 'skipped') {
    return { tone: 'warning', title: t.offlineSessionTitle, message: t.offlineSession };
  }
  if (outcome === 'failed') {
    return { tone: 'danger', title: t.failedTitle, message: t.failed };
  }

  // In review is delivered too: it is in the office, with nothing to do on the phone.
  const delivered = outcome.sent + outcome.inReview;
  const toCheck = outcome.needsFix + outcome.anomalies;

  if (delivered === 0 && toCheck === 0) {
    return outcome.waiting === 0
      ? { tone: 'info', title: t.nothing }
      : { tone: 'warning', title: t.failedTitle, message: t.waiting(outcome.waiting) };
  }

  const details = [
    outcome.needsFix > 0 && t.needsFix(outcome.needsFix),
    outcome.anomalies > 0 && t.anomalies(outcome.anomalies),
    outcome.waiting > 0 && t.waiting(outcome.waiting),
  ].filter((detail): detail is string => detail !== false);

  return {
    tone: details.length > 0 ? 'warning' : 'success',
    title: delivered > 0 ? t.sent(delivered) : t.toCheckTitle,
    message: details.length > 0 ? details.join(' ') : undefined,
  };
}

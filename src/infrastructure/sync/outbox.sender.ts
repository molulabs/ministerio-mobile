import type { AxiosInstance } from 'axios';

import { httpErrorKind } from '../api/errors';
import type { CensusFieldError } from '../db/schema';

/** A census waiting to be sent. */
export type OutboxCensus = {
  id: string;
  payload: Record<string, unknown>;
  /** Sends that failed so far for the network or the server. */
  attempts: number;
  /** Not to be sent before this time (epoch ms), after a failed send; null if it never failed. */
  nextAttemptAt: number | null;
};

/** Where the censuses are kept on the phone (SQLite in the app, a fake in tests). */
export type OutboxStore = {
  /** The censuses of the user that are ready to send, oldest first. Never those of another user. */
  ready(userId: number): Promise<OutboxCensus[]>;
  /** 201: the API made a census of it. */
  markSent(id: string, censusId: number | null, at: number): Promise<void>;
  /** 202: an operator has to sort it out; nothing to fix on the phone. */
  markInReview(id: string, conflict: string | null, at: number): Promise<void>;
  /** 422: the census taker has to fix these fields. */
  markNeedsFix(id: string, errors: CensusFieldError[], at: number): Promise<void>;
  /** 409: the API has another census under this id. It is never sent again. */
  markAnomaly(id: string, at: number): Promise<void>;
  /** The send failed and nothing says the census is wrong: it stays ready, for later. */
  markFailed(id: string, attempts: number, nextAttemptAt: number, at: number): Promise<void>;
};

export type SendResult = {
  sent: number;
  inReview: number;
  needsFix: number;
  anomalies: number;
  /** Censuses still ready after this run: failed, not due yet, or behind one that failed. */
  waiting: number;
};

type Deps = {
  http: AxiosInstance;
  store: OutboxStore;
  /** The user of the online session, or null without one. */
  userId: () => number | null;
  now?: () => number;
};

type SendOptions = {
  /** Sends also the censuses whose next attempt is not due: the census taker asked for it. */
  force?: boolean;
};

const MINUTE = 60_000;
const MAX_BACKOFF_MS = 30 * MINUTE;
/** The API builds the whole census before it answers: more than the client's usual timeout. */
const SEND_TIMEOUT_MS = 30_000;

/** How long to wait after this many failed sends in a row: 1, 2, 4… minutes, up to 30. */
export function backoffMs(attempts: number): number {
  return Math.min(MINUTE * 2 ** (attempts - 1), MAX_BACKOFF_MS);
}

/**
 * Sends the censuses the signed-in user finished, one at a time and oldest first, each with a PUT
 * under its own id: sending one twice (the answer was lost) gives the same answer, not a second
 * census. A census is sent only with the token of the user who took it, so those of other users
 * of this phone are left alone. No signal, a server failure or a lost session stop the run: the
 * censuses behind would fail the same way.
 */
export function createOutboxSender({ http, store, userId, now = Date.now }: Deps) {
  return async function sendCensuses({ force = false }: SendOptions = {}): Promise<SendResult> {
    const result: SendResult = { sent: 0, inReview: 0, needsFix: 0, anomalies: 0, waiting: 0 };
    const user = userId();
    if (user === null) return result;

    const ready = await store.ready(user);
    const due = ready.filter(
      (census) => force || census.nextAttemptAt === null || census.nextAttemptAt <= now(),
    );
    result.waiting = ready.length;

    for (const census of due) {
      let response;
      try {
        response = await http.put<unknown>(
          `/mobile/census-submissions/${census.id}`,
          census.payload,
          {
            timeout: SEND_TIMEOUT_MS,
            // A 401 must stay an error: the client refreshes the token and sends it again.
            validateStatus: (status) => [201, 202, 409, 422].includes(status),
          },
        );
      } catch (error) {
        const kind = httpErrorKind(error);
        // The session is gone: nothing is wrong with the census, and none can be sent.
        if (kind === 'unauthorized') break;

        const attempts = census.attempts + 1;
        await store.markFailed(census.id, attempts, now() + backoffMs(attempts), now());
        // Another 4xx is about this census (or this app version): the next one may go through.
        if (kind === 'client') continue;
        break;
      }

      const body = (response.data ?? {}) as Record<string, unknown>;
      switch (response.status) {
        case 201:
          await store.markSent(
            census.id,
            typeof body.censusId === 'number' ? body.censusId : null,
            now(),
          );
          result.sent += 1;
          break;
        case 202:
          await store.markInReview(
            census.id,
            typeof body.conflict === 'string' ? body.conflict : null,
            now(),
          );
          result.inReview += 1;
          break;
        case 422:
          await store.markNeedsFix(census.id, fieldErrors(body.errors), now());
          result.needsFix += 1;
          break;
        default:
          // 409. Never sent again: the answer would be the same.
          await store.markAnomaly(census.id, now());
          result.anomalies += 1;
      }
      result.waiting -= 1;
    }

    return result;
  };
}

/** The errors of a 422 as the API lists them; anything else in the list is left out. */
function fieldErrors(errors: unknown): CensusFieldError[] {
  if (!Array.isArray(errors)) return [];
  return errors
    .filter(
      (error): error is CensusFieldError =>
        typeof error?.field === 'string' && typeof error?.message === 'string',
    )
    .map(({ field, message }) => ({ field, message }));
}

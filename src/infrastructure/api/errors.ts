import { isAxiosError } from 'axios';

export type HttpErrorKind = 'network' | 'unauthorized' | 'client' | 'server';

/**
 * What kind of failure an API call had: no answer at all (no signal, timeout, API down behind
 * nginx answers 502 and counts as server), 401, another 4xx, or 5xx.
 */
export function httpErrorKind(error: unknown): HttpErrorKind {
  if (!isAxiosError(error) || !error.response) {
    return 'network';
  }
  const { status } = error.response;
  if (status === 401) return 'unauthorized';
  if (status < 500) return 'client';
  return 'server';
}

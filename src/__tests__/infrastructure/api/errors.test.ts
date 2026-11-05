import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { httpErrorKind } from '@/src/infrastructure/api/errors';

function httpError(status: number): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response = { status, data: {}, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('failed', AxiosError.ERR_BAD_RESPONSE, config, undefined, response);
}

describe('httpErrorKind', () => {
  it.each([
    [401, 'unauthorized'],
    [403, 'client'],
    [422, 'client'],
    [500, 'server'],
    [502, 'server'],
  ])('classifies a %i response as %s', (status, kind) => {
    expect(httpErrorKind(httpError(status))).toBe(kind);
  });

  it('classifies a request without response as network', () => {
    expect(httpErrorKind(new AxiosError('Network Error', AxiosError.ERR_NETWORK))).toBe('network');
  });

  it('classifies anything that is not an HTTP error as network', () => {
    expect(httpErrorKind(new Error('boom'))).toBe('network');
  });
});

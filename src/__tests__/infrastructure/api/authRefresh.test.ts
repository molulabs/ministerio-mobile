import {
  type AxiosAdapter,
  AxiosError,
  type AxiosResponse,
  create,
  type InternalAxiosRequestConfig,
} from 'axios';

import { type AuthRefreshHandlers, installAuthRefresh } from '@/src/infrastructure/api/authRefresh';

type Reply = { status: number; data?: unknown } | 'network';

/**
 * A fake API: each URL answers from its queue (the last reply repeats). Records every request
 * with the Authorization header it carried.
 */
function fakeApi(replies: Record<string, Reply[]>) {
  const calls: { url: string; authorization?: string }[] = [];

  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? '';
    calls.push({ url, authorization: config.headers.Authorization as string | undefined });
    const queue = replies[url];
    if (!queue) throw new Error(`Unexpected request to ${url}`);
    const reply = queue.length > 1 ? queue.shift()! : queue[0];

    if (reply === 'network') {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
    }
    const response: AxiosResponse = {
      data: reply.data ?? {},
      status: reply.status,
      statusText: String(reply.status),
      headers: {},
      config,
    };
    if (reply.status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${reply.status}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
        undefined,
        response,
      );
    }
    return response;
  };

  return { adapter, calls };
}

function setup(replies: Record<string, Reply[]>, refreshToken: string | null = 'refresh-1') {
  const api = fakeApi(replies);
  const client = create({ adapter: api.adapter });
  client.defaults.headers.common.Authorization = 'Bearer expired';

  const setAccessToken = jest.fn((token: string | null) => {
    client.defaults.headers.common.Authorization = token ? `Bearer ${token}` : undefined;
  });
  const handlers: jest.Mocked<AuthRefreshHandlers> = {
    getRefreshToken: jest.fn(async () => refreshToken),
    onTokensRefreshed: jest.fn<Promise<void>, [string, string]>(async () => {}),
    onSessionExpired: jest.fn(async () => {}),
  };
  installAuthRefresh(client, setAccessToken, handlers);

  return { client, calls: api.calls, setAccessToken, handlers };
}

const refreshed = { status: 200, data: { token: 'fresh', refresh_token: 'refresh-1' } };

describe('installAuthRefresh', () => {
  it('refreshes an expired access token and repeats the request with the new one', async () => {
    const { client, calls, handlers } = setup({
      '/me': [{ status: 401 }, { status: 200, data: { id: 4 } }],
      '/refresh': [refreshed],
    });

    const response = await client.get('/me');

    expect(response.data).toEqual({ id: 4 });
    expect(calls.map((call) => call.url)).toEqual(['/me', '/refresh', '/me']);
    expect(calls[2].authorization).toBe('Bearer fresh');
    expect(handlers.onTokensRefreshed).toHaveBeenCalledWith('fresh', 'refresh-1');
    expect(handlers.onSessionExpired).not.toHaveBeenCalled();
  });

  it('shares one refresh between requests that fail together', async () => {
    const { client, calls } = setup({
      '/me': [{ status: 401 }, { status: 200 }],
      '/catalogs': [{ status: 401 }, { status: 200 }],
      '/refresh': [refreshed],
    });

    await Promise.all([client.get('/me'), client.get('/catalogs')]);

    expect(calls.filter((call) => call.url === '/refresh')).toHaveLength(1);
    expect(calls.filter((call) => call.url !== '/refresh')).toHaveLength(4);
  });

  it('ends the session when the API refuses the refresh token', async () => {
    const { client, handlers } = setup({
      '/me': [{ status: 401 }],
      '/refresh': [{ status: 401 }],
    });

    await expect(client.get('/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(handlers.onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('keeps the session when the refresh cannot reach the API', async () => {
    const { client, calls, handlers } = setup({
      '/me': [{ status: 401 }],
      '/refresh': ['network'],
    });

    // The caller gets the original 401, not the network error of the refresh.
    await expect(client.get('/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(handlers.onSessionExpired).not.toHaveBeenCalled();
    expect(calls.map((call) => call.url)).toEqual(['/me', '/refresh']);
  });

  it('keeps the session when the refresh fails on the server', async () => {
    const { client, handlers } = setup({
      '/me': [{ status: 401 }],
      '/refresh': [{ status: 502 }],
    });

    await expect(client.get('/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(handlers.onSessionExpired).not.toHaveBeenCalled();
  });

  it('ends the session when there is no refresh token saved', async () => {
    const { client, calls, handlers } = setup({ '/me': [{ status: 401 }] }, null);

    await expect(client.get('/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(handlers.onSessionExpired).toHaveBeenCalledTimes(1);
    expect(calls.map((call) => call.url)).toEqual(['/me']);
  });

  it('repeats a request only once, even if it gets 401 again', async () => {
    const { client, calls } = setup({
      '/me': [{ status: 401 }],
      '/refresh': [refreshed],
    });

    await expect(client.get('/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(calls.map((call) => call.url)).toEqual(['/me', '/refresh', '/me']);
  });

  it.each(['/login', '/refresh', '/logout'])(
    'does not refresh after a 401 from %s',
    async (url) => {
      const { client, calls } = setup({ [url]: [{ status: 401 }] });

      await expect(client.post(url)).rejects.toMatchObject({ response: { status: 401 } });
      expect(calls.map((call) => call.url)).toEqual([url]);
    },
  );

  it('leaves other errors alone', async () => {
    const { client, calls } = setup({ '/me': [{ status: 500 }] });

    await expect(client.get('/me')).rejects.toMatchObject({ response: { status: 500 } });
    expect(calls).toHaveLength(1);
  });
});

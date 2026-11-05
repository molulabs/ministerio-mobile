import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { httpErrorKind } from './errors';

interface RefreshApiResponse {
  token: string;
  refresh_token: string;
}

export interface AuthRefreshHandlers {
  getRefreshToken: () => Promise<string | null>;
  /** Saves the new tokens; the interceptor already set the access token on the client. */
  onTokensRefreshed: (accessToken: string, refreshToken: string) => Promise<void>;
  /** The API refused the refresh token (401): the user has to sign in online again. */
  onSessionExpired: () => Promise<void>;
}

/** Requests whose 401 means wrong credentials or a dead refresh token, never "refresh and retry". */
const noRefreshUrls = ['/login', '/refresh', '/logout'];

type RetriableConfig = InternalAxiosRequestConfig & { authRetried?: boolean };

/**
 * On a 401 the access token has expired (it lasts 1 hour): get a new one from /api/refresh and
 * repeat the request once. Requests that fail together share one refresh.
 *
 * Only a 401 from /api/refresh ends the session. Without signal or with the API failing the
 * session stays and the caller gets the original error: the enumerator keeps working offline.
 */
export function installAuthRefresh(
  client: AxiosInstance,
  setAccessToken: (token: string | null) => void,
  handlers: AuthRefreshHandlers,
): void {
  let refreshing: Promise<string | null> | null = null;

  /** The new access token, or null when the session has expired. Throws on network/server errors. */
  async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = await handlers.getRefreshToken();
    if (!refreshToken) {
      await handlers.onSessionExpired();
      return null;
    }
    try {
      const { data } = await client.post<RefreshApiResponse>('/refresh', {
        refresh_token: refreshToken,
      });
      setAccessToken(data.token);
      await handlers.onTokensRefreshed(data.token, data.refresh_token);
      return data.token;
    } catch (error) {
      if (httpErrorKind(error) === 'unauthorized') {
        await handlers.onSessionExpired();
        return null;
      }
      throw error;
    }
  }

  client.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isRefreshable =
      config &&
      error.response?.status === 401 &&
      !config.authRetried &&
      !noRefreshUrls.includes(config.url ?? '');
    if (!isRefreshable) {
      throw error;
    }

    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null;
    });

    let accessToken: string | null;
    try {
      accessToken = await refreshing;
    } catch {
      // The refresh could not reach the API: keep the session, report the original failure.
      throw error;
    }
    if (!accessToken) {
      throw error;
    }

    config.authRetried = true;
    config.headers.Authorization = `Bearer ${accessToken}`;
    return client.request(config);
  });
}

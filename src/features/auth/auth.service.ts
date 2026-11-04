import { apiClient } from '@/src/infrastructure/api/client';

import type { AuthTokens, SessionUser } from './auth.model';

interface LoginApiResponse {
  token: string;
  refresh_token: string;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<LoginApiResponse>('/login', { email, password });
  return { accessToken: data.token, refreshToken: data.refresh_token };
}

/** Needs the access token already set on the client. */
export async function fetchCurrentUser(): Promise<SessionUser> {
  const { data } = await apiClient.get<SessionUser>('/me');
  return data;
}

/** Invalidates the refresh token on the API. Needs the access token already set on the client. */
export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/logout', { refresh_token: refreshToken });
}

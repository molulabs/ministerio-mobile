import { create } from 'axios';
import Constants from 'expo-constants';

import { type AuthRefreshHandlers, installAuthRefresh } from './authRefresh';

const apiUrl: string = Constants.expoConfig?.extra?.apiUrl;

if (!apiUrl) {
  throw new Error('apiUrl is missing from the app config (app.config.ts → extra.apiUrl)');
}

/** The one HTTP client of the app. */
export const apiClient = create({
  baseURL: `${apiUrl}/api`,
  timeout: 10_000,
  headers: { Accept: 'application/json' },
});

/** Sends the access token as a bearer token on every request; null stops sending it. */
export function setAccessToken(token: string | null): void {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

let refreshConfigured = false;

/** Called once by the session at start-up: infrastructure does not know where tokens are kept. */
export function configureAuthRefresh(handlers: AuthRefreshHandlers): void {
  if (refreshConfigured) return;
  refreshConfigured = true;
  installAuthRefresh(apiClient, setAccessToken, handlers);
}

import { create } from 'axios';
import Constants from 'expo-constants';

const apiUrl: string = Constants.expoConfig?.extra?.apiUrl;

if (!apiUrl) {
  throw new Error('apiUrl is missing from the app config (app.config.ts → extra.apiUrl)');
}

/** The one HTTP client of the app. Auth and refresh interceptors come with the login. */
export const apiClient = create({
  baseURL: `${apiUrl}/api`,
  timeout: 10_000,
  headers: { Accept: 'application/json' },
});

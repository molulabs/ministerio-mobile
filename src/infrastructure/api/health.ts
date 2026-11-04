import { apiClient } from './client';

export type ApiHealth = 'ok' | 'unavailable';

/**
 * Asks the public GET /api/health whether the API can serve requests. Any failure (no network,
 * timeout, 5xx) counts as unavailable: the caller only needs to know if the API answers.
 */
export async function checkApiHealth(): Promise<ApiHealth> {
  try {
    const { data } = await apiClient.get<{ status: string }>('/health');
    return data.status === 'ok' ? 'ok' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

import * as SecureStore from 'expo-secure-store';

/**
 * Small secrets kept in the Android Keystore (tokens, the session user). Values are strings of a
 * few KB at most: anything bigger belongs in SQLite.
 */
export const secureStore = {
  get: (key: string): Promise<string | null> => SecureStore.getItemAsync(key),

  set: (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value),

  remove: (key: string): Promise<void> => SecureStore.deleteItemAsync(key),

  async getJson<T>(key: string): Promise<T | null> {
    const value = await SecureStore.getItemAsync(key);
    return value === null ? null : (JSON.parse(value) as T);
  },

  setJson: (key: string, value: unknown): Promise<void> =>
    SecureStore.setItemAsync(key, JSON.stringify(value)),
};

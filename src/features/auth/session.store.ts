import { create } from 'zustand';

import { setAccessToken } from '@/src/infrastructure/api/client';
import { httpErrorKind } from '@/src/infrastructure/api/errors';
import { secureStore } from '@/src/infrastructure/storage/secureStore';

import { canTakeCensuses, type SessionUser, SignInError } from './auth.model';
import * as authService from './auth.service';

const keys = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  user: 'auth.user',
} as const;

type SessionStatus = 'restoring' | 'signedOut' | 'signedIn';

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  /** Reads the saved session at start-up. Works without signal: it never calls the API. */
  restore: () => Promise<void>;
  /** Throws SignInError; nothing is saved unless every step succeeds. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Always ends signed out locally, even when the API cannot be reached. */
  signOut: () => Promise<void>;
}

async function clearSavedSession(): Promise<void> {
  setAccessToken(null);
  await Promise.all(Object.values(keys).map((key) => secureStore.remove(key)));
}

export const useSession = create<SessionState>()((set) => ({
  status: 'restoring',
  user: null,

  async restore() {
    try {
      const [accessToken, refreshToken, user] = await Promise.all([
        secureStore.get(keys.accessToken),
        secureStore.get(keys.refreshToken),
        secureStore.getJson<SessionUser>(keys.user),
      ]);
      if (accessToken && refreshToken && user) {
        setAccessToken(accessToken);
        set({ status: 'signedIn', user });
        return;
      }
    } catch {
      // A value that cannot be read is treated as no session.
    }
    await clearSavedSession();
    set({ status: 'signedOut', user: null });
  },

  async signIn(email, password) {
    let tokens;
    try {
      tokens = await authService.login(email, password);
    } catch (error) {
      const kind = httpErrorKind(error);
      throw new SignInError(
        kind === 'unauthorized' ? 'invalid_credentials' : kind === 'network' ? 'network' : 'server',
      );
    }

    setAccessToken(tokens.accessToken);
    let user: SessionUser;
    try {
      user = await authService.fetchCurrentUser();
    } catch (error) {
      setAccessToken(null);
      throw new SignInError(httpErrorKind(error) === 'network' ? 'network' : 'server');
    }

    if (!canTakeCensuses(user.role)) {
      await authService.logout(tokens.refreshToken).catch(() => {});
      setAccessToken(null);
      throw new SignInError('cannot_take_censuses');
    }

    await Promise.all([
      secureStore.set(keys.accessToken, tokens.accessToken),
      secureStore.set(keys.refreshToken, tokens.refreshToken),
      secureStore.setJson(keys.user, user),
    ]);
    set({ status: 'signedIn', user });
  },

  async signOut() {
    const refreshToken = await secureStore.get(keys.refreshToken);
    if (refreshToken) {
      await authService.logout(refreshToken).catch(() => {});
    }
    await clearSavedSession();
    set({ status: 'signedOut', user: null });
  },
}));

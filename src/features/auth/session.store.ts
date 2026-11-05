import { create } from 'zustand';

import { configureAuthRefresh, setAccessToken } from '@/src/infrastructure/api/client';
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
  /** True when the session ended because the API refused the refresh token. */
  expired: boolean;
  /** Reads the saved session at start-up. Works without signal: it never waits for the API. */
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
  expired: false,

  async restore() {
    try {
      const [accessToken, refreshToken, user] = await Promise.all([
        secureStore.get(keys.accessToken),
        secureStore.get(keys.refreshToken),
        secureStore.getJson<SessionUser>(keys.user),
      ]);
      if (accessToken && refreshToken && user) {
        setAccessToken(accessToken);
        set({ status: 'signedIn', user, expired: false });
        void refreshCurrentUser(user.id);
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
    set({ status: 'signedIn', user, expired: false });
  },

  async signOut() {
    const refreshToken = await secureStore.get(keys.refreshToken);
    if (refreshToken) {
      await authService.logout(refreshToken).catch(() => {});
    }
    await clearSavedSession();
    set({ status: 'signedOut', user: null, expired: false });
  },
}));

/**
 * Brings the saved user up to date (a name changed in the backoffice) when there is signal.
 * Any failure keeps the saved user: offline is the normal case in the field.
 */
async function refreshCurrentUser(userId: number): Promise<void> {
  try {
    const user = await authService.fetchCurrentUser();
    const { status, user: current } = useSession.getState();
    if (status !== 'signedIn' || current?.id !== userId || user.id !== userId) return;
    await secureStore.setJson(keys.user, user);
    useSession.setState({ user });
  } catch {
    // Offline or session expired (the refresh interceptor already handled that).
  }
}

configureAuthRefresh({
  getRefreshToken: () => secureStore.get(keys.refreshToken),
  async onTokensRefreshed(accessToken, refreshToken) {
    await Promise.all([
      secureStore.set(keys.accessToken, accessToken),
      secureStore.set(keys.refreshToken, refreshToken),
    ]);
  },
  async onSessionExpired() {
    await clearSavedSession();
    useSession.setState({ status: 'signedOut', user: null, expired: true });
  },
});

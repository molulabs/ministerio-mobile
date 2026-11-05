import { create } from 'zustand';

import { configureAuthRefresh, setAccessToken } from '@/src/infrastructure/api/client';
import { httpErrorKind } from '@/src/infrastructure/api/errors';
import { secureStore } from '@/src/infrastructure/storage/secureStore';

import {
  canTakeCensuses,
  type SessionMode,
  type SessionUser,
  SignInError,
  type SignInErrorKind,
} from './auth.model';
import * as authService from './auth.service';
import { offlineCredentials } from './offline';
import type { OfflineCheck } from './offline/offlineCredentials';

const keys = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  user: 'auth.user',
} as const;

type SessionStatus = 'restoring' | 'signedOut' | 'signedIn';

/** Why the last session ended without the user signing out, to tell them on the login screen. */
export type SignedOutReason = 'expired' | 'offline_expired';

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  /** Online: the API checked the password and the phone has tokens. Offline: the phone did. */
  mode: SessionMode | null;
  signedOutReason: SignedOutReason | null;
  /** Reads the saved session at start-up. Waits for the API only when the 7 days are over. */
  restore: () => Promise<void>;
  /** Online first; without signal, against the phone's offline credential. Throws SignInError. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Always ends signed out locally. Keeps the offline credential to sign in again offline. */
  signOut: () => Promise<void>;
}

/** Removes the session and its tokens. The offline credentials stay. */
async function clearSavedSession(): Promise<void> {
  setAccessToken(null);
  await Promise.all(Object.values(keys).map((key) => secureStore.remove(key)));
}

const offlineErrorKinds: Record<Exclude<OfflineCheck, { ok: true }>['reason'], SignInErrorKind> = {
  no_credential: 'offline_no_credential',
  expired: 'offline_expired',
  locked: 'offline_locked',
  clock_rewound: 'offline_clock',
  wrong_password: 'offline_wrong_password',
};

export const useSession = create<SessionState>()((set) => {
  const signedIn = (user: SessionUser, mode: SessionMode) =>
    set({ status: 'signedIn', user, mode, signedOutReason: null });

  const signedOut = (signedOutReason: SignedOutReason | null) =>
    set({ status: 'signedOut', user: null, mode: null, signedOutReason });

  /** No signal: the phone checks the password. The session has no tokens of its own. */
  async function signInOffline(email: string, password: string): Promise<void> {
    const check = await offlineCredentials.check(email, password);
    if (!check.ok) {
      throw new SignInError(
        offlineErrorKinds[check.reason],
        check.reason === 'wrong_password' ? check.remainingAttempts : undefined,
      );
    }
    // Tokens left on the phone are never used for another sign-in: each user sends with their own.
    await clearSavedSession();
    await secureStore.setJson(keys.user, check.user);
    signedIn(check.user, 'offline');
  }

  return {
    status: 'restoring',
    user: null,
    mode: null,
    signedOutReason: null,

    async restore() {
      let user: SessionUser | null = null;
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      try {
        [user, accessToken, refreshToken] = await Promise.all([
          secureStore.getJson<SessionUser>(keys.user),
          secureStore.get(keys.accessToken),
          secureStore.get(keys.refreshToken),
        ]);
      } catch {
        // A value that cannot be read is treated as no session.
      }
      if (!user) {
        await clearSavedSession();
        signedOut(null);
        return;
      }

      const hasTokens = Boolean(accessToken && refreshToken);
      if (hasTokens) setAccessToken(accessToken);

      if (await offlineCredentials.isWithinWindow(user.id)) {
        signedIn(user, hasTokens ? 'online' : 'offline');
        if (hasTokens) void refreshCurrentUser(user.id);
        return;
      }

      // Over 7 days without the API confirming the account: only the API can let it go on.
      if (hasTokens) {
        try {
          const current = await authService.fetchCurrentUser();
          await secureStore.setJson(keys.user, current);
          await offlineCredentials.confirmOnline(current.id, current);
          signedIn(current, 'online');
          return;
        } catch {
          // Refused or unreachable: falls through to signing out. A refused refresh token has
          // already signed out through the interceptor.
          if (useSession.getState().status === 'signedOut') return;
        }
      }
      await clearSavedSession();
      signedOut('offline_expired');
    },

    async signIn(email, password) {
      let tokens;
      try {
        tokens = await authService.login(email, password);
      } catch (error) {
        const kind = httpErrorKind(error);
        if (kind === 'unauthorized') throw new SignInError('invalid_credentials');
        if (kind === 'network' || kind === 'server') return signInOffline(email, password);
        throw new SignInError('server');
      }

      setAccessToken(tokens.accessToken);
      let user: SessionUser;
      try {
        user = await authService.fetchCurrentUser();
      } catch (error) {
        setAccessToken(null);
        const kind = httpErrorKind(error);
        if (kind === 'network' || kind === 'server') return signInOffline(email, password);
        throw new SignInError('server');
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
      try {
        await offlineCredentials.rememberPassword(email, password, user);
      } catch {
        // Without a verifier the user can still work online; offline sign-in will ask for signal.
      }
      signedIn(user, 'online');
    },

    async signOut() {
      const refreshToken = await secureStore.get(keys.refreshToken);
      if (refreshToken) {
        await authService.logout(refreshToken).catch(() => {});
      }
      await clearSavedSession();
      signedOut(null);
    },
  };
});

/**
 * Brings the saved user up to date (a name changed in the backoffice) when there is signal, and
 * counts as the API confirming the account. Any failure keeps the saved user.
 */
async function refreshCurrentUser(userId: number): Promise<void> {
  try {
    const user = await authService.fetchCurrentUser();
    const { status, user: current } = useSession.getState();
    if (status !== 'signedIn' || current?.id !== userId || user.id !== userId) return;
    await secureStore.setJson(keys.user, user);
    await offlineCredentials.confirmOnline(userId, user);
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
    const { user } = useSession.getState();
    if (user) await offlineCredentials.confirmOnline(user.id);
  },
  async onSessionExpired() {
    await clearSavedSession();
    useSession.setState({
      status: 'signedOut',
      user: null,
      mode: null,
      signedOutReason: 'expired',
    });
  },
});

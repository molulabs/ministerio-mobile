import type { SessionUser } from '../auth.model';

/** How long a phone accepts offline sign-ins after the API last confirmed the account. */
export const OFFLINE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** Wrong passwords in a row, offline, before an online sign-in is required. */
export const MAX_OFFLINE_ATTEMPTS = 5;
/** A clock that moved back more than this since it was last seen was set back by hand. */
const CLOCK_TOLERANCE_MS = 10 * 60 * 1000;

/** What is kept per user to check their password without signal. Never the password itself. */
export interface OfflineCredential {
  version: 1;
  user: SessionUser;
  /** Hex. */
  salt: string;
  iterations: number;
  /** Hex PBKDF2-SHA256 of the password. */
  hash: string;
  /** When the API last confirmed the account: an online sign-in or a token refresh. */
  lastOnlineAt: number;
  failedAttempts: number;
}

export type OfflineCheck =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: 'no_credential' | 'expired' | 'locked' | 'clock_rewound' }
  | { ok: false; reason: 'wrong_password'; remainingAttempts: number };

export interface OfflineCredentialsDeps {
  read: () => Promise<Record<string, OfflineCredential>>;
  write: (credentials: Record<string, OfflineCredential>) => Promise<void>;
  readLastSeenAt: () => Promise<number | null>;
  writeLastSeenAt: (time: number) => Promise<void>;
  /** PBKDF2-SHA256, hex in and out. */
  derive: (password: string, saltHex: string, iterations: number) => Promise<string>;
  randomSaltHex: () => string;
  iterations: number;
  now: () => number;
}

const credentialKey = (email: string) => email.trim().toLowerCase();

/** Compares two hex strings in time that does not depend on where they differ. */
function sameHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}

export function createOfflineCredentials(deps: OfflineCredentialsDeps) {
  /** False when the clock went back since last seen; otherwise records the current time. */
  async function clockLooksRight(): Promise<boolean> {
    const now = deps.now();
    const lastSeenAt = await deps.readLastSeenAt();
    if (lastSeenAt !== null && now < lastSeenAt - CLOCK_TOLERANCE_MS) {
      return false;
    }
    if (lastSeenAt === null || now > lastSeenAt) {
      await deps.writeLastSeenAt(now);
    }
    return true;
  }

  return {
    /** After the API accepted the password: keep a verifier for offline sign-ins. */
    async rememberPassword(email: string, password: string, user: SessionUser): Promise<void> {
      const salt = deps.randomSaltHex();
      const hash = await deps.derive(password, salt, deps.iterations);
      const credentials = await deps.read();
      // One credential per user: an email changed in the backoffice replaces the old entry.
      for (const [key, credential] of Object.entries(credentials)) {
        if (credential.user.id === user.id) delete credentials[key];
      }
      credentials[credentialKey(email)] = {
        version: 1,
        user,
        salt,
        iterations: deps.iterations,
        hash,
        lastOnlineAt: deps.now(),
        failedAttempts: 0,
      };
      await deps.write(credentials);
      // The API just accepted the account: the phone's current time becomes the reference again.
      await deps.writeLastSeenAt(deps.now());
    },

    /** The API confirmed the account is still active (a token refresh): restart the window. */
    async confirmOnline(userId: number, user?: SessionUser): Promise<void> {
      const credentials = await deps.read();
      const entry = Object.entries(credentials).find(([, c]) => c.user.id === userId);
      if (!entry) return;
      const [key, credential] = entry;
      credentials[key] = { ...credential, user: user ?? credential.user, lastOnlineAt: deps.now() };
      await deps.write(credentials);
      await deps.writeLastSeenAt(deps.now());
    },

    /** Checks a password without signal. Wrong passwords count towards the lock. */
    async check(email: string, password: string): Promise<OfflineCheck> {
      const credentials = await deps.read();
      const key = credentialKey(email);
      const credential = credentials[key];
      if (!credential) return { ok: false, reason: 'no_credential' };
      if (!(await clockLooksRight())) return { ok: false, reason: 'clock_rewound' };
      if (deps.now() - credential.lastOnlineAt > OFFLINE_WINDOW_MS) {
        return { ok: false, reason: 'expired' };
      }
      if (credential.failedAttempts >= MAX_OFFLINE_ATTEMPTS) return { ok: false, reason: 'locked' };

      const hash = await deps.derive(password, credential.salt, credential.iterations);
      if (sameHex(hash, credential.hash)) {
        if (credential.failedAttempts > 0) {
          credentials[key] = { ...credential, failedAttempts: 0 };
          await deps.write(credentials);
        }
        return { ok: true, user: credential.user };
      }

      const failedAttempts = credential.failedAttempts + 1;
      credentials[key] = { ...credential, failedAttempts };
      await deps.write(credentials);
      return failedAttempts >= MAX_OFFLINE_ATTEMPTS
        ? { ok: false, reason: 'locked' }
        : {
            ok: false,
            reason: 'wrong_password',
            remainingAttempts: MAX_OFFLINE_ATTEMPTS - failedAttempts,
          };
    },

    /** Whether a saved session of this user may go on without signal. */
    async isWithinWindow(userId: number): Promise<boolean> {
      const credential = Object.values(await deps.read()).find((c) => c.user.id === userId);
      if (!credential) return false;
      if (!(await clockLooksRight())) return false;
      return deps.now() - credential.lastOnlineAt <= OFFLINE_WINDOW_MS;
    },
  };
}

export type OfflineCredentials = ReturnType<typeof createOfflineCredentials>;

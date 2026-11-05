/** Roles as the API sends them (api/src/Enum/UserRole.php). */
export type UserRole = 'ROLE_OPERATOR' | 'ROLE_ENUMERATOR' | 'ROLE_ADMIN' | 'ROLE_SUPERADMIN';

/** GET /api/me */
export interface SessionUser {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Same rule as UserRole::canTakeCensuses() in the API: every role but the operator. */
export function canTakeCensuses(role: UserRole): boolean {
  return role !== 'ROLE_OPERATOR';
}

export type SignInErrorKind =
  | 'invalid_credentials'
  | 'cannot_take_censuses'
  | 'server'
  /** Offline: wrong password, with attempts left before the lock. */
  | 'offline_wrong_password'
  /** Offline: this user never signed in online on this phone. */
  | 'offline_no_credential'
  /** Offline: more than 7 days since the API last confirmed the account. */
  | 'offline_expired'
  /** Offline: too many wrong passwords in a row. */
  | 'offline_locked'
  /** Offline: the phone clock was set back. */
  | 'offline_clock';

export class SignInError extends Error {
  constructor(
    public readonly kind: SignInErrorKind,
    public readonly remainingAttempts?: number,
  ) {
    super(kind);
    this.name = 'SignInError';
  }
}

/** How the current session was opened: the API checked the password, or the phone did. */
export type SessionMode = 'online' | 'offline';

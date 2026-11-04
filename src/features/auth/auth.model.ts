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

export type SignInErrorKind = 'invalid_credentials' | 'cannot_take_censuses' | 'network' | 'server';

export class SignInError extends Error {
  constructor(public readonly kind: SignInErrorKind) {
    super(kind);
    this.name = 'SignInError';
  }
}

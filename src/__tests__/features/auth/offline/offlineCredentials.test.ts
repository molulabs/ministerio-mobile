import type { SessionUser } from '@/src/features/auth/auth.model';
import {
  createOfflineCredentials,
  MAX_OFFLINE_ATTEMPTS,
  type OfflineCredential,
  OFFLINE_WINDOW_MS,
} from '@/src/features/auth/offline/offlineCredentials';

const rosa: SessionUser = {
  id: 4,
  firstname: 'Rosa',
  lastname: 'Ensayo',
  email: 'rosa@company.com',
  role: 'ROLE_ENUMERATOR',
};
const hugo: SessionUser = { ...rosa, id: 5, firstname: 'Hugo', email: 'hugo@company.com' };

const HOUR = 60 * 60 * 1000;

/** Hex of a string's characters: the fake hash must not show the password in clear. */
const toHex = (text: string) =>
  [...text].map((char) => char.charCodeAt(0).toString(16).padStart(2, '0')).join('');

function setup() {
  let stored: Record<string, OfflineCredential> = {};
  let lastSeenAt: number | null = null;
  let now = Date.UTC(2026, 10, 4, 12);
  let saltCounter = 0;

  const offline = createOfflineCredentials({
    read: async () => structuredClone(stored),
    write: async (credentials) => {
      stored = structuredClone(credentials);
    },
    readLastSeenAt: async () => lastSeenAt,
    writeLastSeenAt: async (time) => {
      lastSeenAt = time;
    },
    // Deterministic stand-in for PBKDF2: depends on every input, like the real one.
    derive: async (password, salt, iterations) => toHex(`${password}|${salt}|${iterations}`),
    randomSaltHex: () => `salt${++saltCounter}`,
    iterations: 1000,
    now: () => now,
  });

  return {
    offline,
    stored: () => stored,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe('offline credentials', () => {
  it('accepts the password the API accepted, and never stores it', async () => {
    const { offline, stored } = setup();
    await offline.rememberPassword('rosa@company.com', 'secreta', rosa);

    expect(await offline.check('rosa@company.com', 'secreta')).toEqual({ ok: true, user: rosa });
    expect(JSON.stringify(stored())).not.toContain('secreta');
  });

  it('ignores case and spaces around the email', async () => {
    const { offline } = setup();
    await offline.rememberPassword('rosa@company.com', 'secreta', rosa);

    expect(await offline.check('  Rosa@Company.com ', 'secreta')).toMatchObject({ ok: true });
  });

  it('needs an online sign-in first on this phone', async () => {
    const { offline } = setup();

    expect(await offline.check('rosa@company.com', 'secreta')).toEqual({
      ok: false,
      reason: 'no_credential',
    });
  });

  it('keeps one credential per user on a shared phone', async () => {
    const { offline } = setup();
    await offline.rememberPassword('rosa@company.com', 'de-rosa', rosa);
    await offline.rememberPassword('hugo@company.com', 'de-hugo', hugo);

    expect(await offline.check('rosa@company.com', 'de-rosa')).toMatchObject({ ok: true });
    expect(await offline.check('hugo@company.com', 'de-hugo')).toMatchObject({ ok: true });
    expect(await offline.check('hugo@company.com', 'de-rosa')).toMatchObject({
      reason: 'wrong_password',
    });
  });

  it('uses a new salt each time the password is remembered', async () => {
    const { offline, stored } = setup();
    await offline.rememberPassword('rosa@company.com', 'secreta', rosa);
    const first = stored()['rosa@company.com'];
    await offline.rememberPassword('rosa@company.com', 'secreta', rosa);
    const second = stored()['rosa@company.com'];

    expect(second.salt).not.toBe(first.salt);
    expect(second.hash).not.toBe(first.hash);
  });

  describe('the 7-day window', () => {
    it('accepts a sign-in just inside it', async () => {
      const { offline, advance } = setup();
      await offline.rememberPassword('rosa@company.com', 'secreta', rosa);
      advance(OFFLINE_WINDOW_MS);

      expect(await offline.check('rosa@company.com', 'secreta')).toMatchObject({ ok: true });
      expect(await offline.isWithinWindow(rosa.id)).toBe(true);
    });

    it('refuses a sign-in after it, even with the right password', async () => {
      const { offline, advance } = setup();
      await offline.rememberPassword('rosa@company.com', 'secreta', rosa);
      advance(OFFLINE_WINDOW_MS + 1);

      expect(await offline.check('rosa@company.com', 'secreta')).toEqual({
        ok: false,
        reason: 'expired',
      });
      expect(await offline.isWithinWindow(rosa.id)).toBe(false);
    });

    it('starts again when the API confirms the account (a token refresh)', async () => {
      const { offline, advance } = setup();
      await offline.rememberPassword('rosa@company.com', 'secreta', rosa);
      advance(6 * 24 * HOUR);
      await offline.confirmOnline(rosa.id);
      advance(6 * 24 * HOUR);

      expect(await offline.check('rosa@company.com', 'secreta')).toMatchObject({ ok: true });
    });

    it('is closed for a user without credential', async () => {
      const { offline } = setup();

      expect(await offline.isWithinWindow(rosa.id)).toBe(false);
    });
  });

  describe('wrong passwords', () => {
    it('counts down the attempts left', async () => {
      const { offline } = setup();
      await offline.rememberPassword('rosa@company.com', 'secreta', rosa);

      expect(await offline.check('rosa@company.com', 'mala')).toEqual({
        ok: false,
        reason: 'wrong_password',
        remainingAttempts: MAX_OFFLINE_ATTEMPTS - 1,
      });
    });

    it(`locks after ${MAX_OFFLINE_ATTEMPTS} in a row, even for the right password`, async () => {
      const { offline } = setup();
      await offline.rememberPassword('rosa@company.com', 'secreta', rosa);
      for (let i = 1; i < MAX_OFFLINE_ATTEMPTS; i++) {
        await offline.check('rosa@company.com', 'mala');
      }

      expect(await offline.check('rosa@company.com', 'mala')).toEqual({
        ok: false,
        reason: 'locked',
      });
      expect(await offline.check('rosa@company.com', 'secreta')).toEqual({
        ok: false,
        reason: 'locked',
      });
    });

    it('starts counting again after a right password', async () => {
      const { offline, stored } = setup();
      await offline.rememberPassword('rosa@company.com', 'secreta', rosa);
      await offline.check('rosa@company.com', 'mala');
      await offline.check('rosa@company.com', 'secreta');

      expect(stored()['rosa@company.com'].failedAttempts).toBe(0);
    });

    it('unlocks with an online sign-in', async () => {
      const { offline } = setup();
      await offline.rememberPassword('rosa@company.com', 'secreta', rosa);
      for (let i = 0; i < MAX_OFFLINE_ATTEMPTS; i++) {
        await offline.check('rosa@company.com', 'mala');
      }
      await offline.rememberPassword('rosa@company.com', 'secreta', rosa);

      expect(await offline.check('rosa@company.com', 'secreta')).toMatchObject({ ok: true });
    });
  });

  describe('the phone clock', () => {
    it('refuses sign-ins once the clock was set back', async () => {
      const { offline, advance } = setup();
      await offline.rememberPassword('rosa@company.com', 'secreta', rosa);
      advance(-2 * HOUR);

      expect(await offline.check('rosa@company.com', 'secreta')).toEqual({
        ok: false,
        reason: 'clock_rewound',
      });
      expect(await offline.isWithinWindow(rosa.id)).toBe(false);
    });

    it('takes the clock as right again after an online sign-in', async () => {
      const { offline, advance } = setup();
      await offline.rememberPassword('rosa@company.com', 'secreta', rosa);
      advance(-2 * HOUR);
      await offline.rememberPassword('rosa@company.com', 'secreta', rosa);

      expect(await offline.check('rosa@company.com', 'secreta')).toMatchObject({ ok: true });
    });

    it('tolerates small adjustments, like a network time sync', async () => {
      const { offline, advance } = setup();
      await offline.rememberPassword('rosa@company.com', 'secreta', rosa);
      advance(-2 * 60 * 1000);

      expect(await offline.check('rosa@company.com', 'secreta')).toMatchObject({ ok: true });
    });
  });
});

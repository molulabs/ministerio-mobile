import { uuidv7 } from '@/src/infrastructure/crypto/uuid';

// The random bytes come from native code, which tests do not load.
jest.mock('@/src/infrastructure/crypto/pbkdf2', () => ({ randomHex: jest.fn() }));

/** The pattern the API route accepts for the id (Symfony's Requirement::UUID). */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const ones = (bytes: number) => 'f'.repeat(bytes * 2);
const zeros = (bytes: number) => '0'.repeat(bytes * 2);

describe('uuidv7', () => {
  it('writes the time first, then the version and the variant', () => {
    // 2026-11-13T00:00:00.000Z
    const now = Date.UTC(2026, 10, 13);

    expect(uuidv7(now, ones)).toBe(
      `${now.toString(16).padStart(12, '0').slice(0, 8)}-${now.toString(16).padStart(12, '0').slice(8)}-7fff-bfff-ffffffffffff`,
    );
    expect(uuidv7(now, zeros)).toMatch(/-7000-8000-000000000000$/);
  });

  it('is an id the API accepts, whatever the random part', () => {
    expect(uuidv7(Date.UTC(2026, 10, 13), ones)).toMatch(UUID);
    expect(uuidv7(Date.UTC(2026, 10, 13), zeros)).toMatch(UUID);
    expect(uuidv7(0, zeros)).toMatch(UUID);
  });

  it('sorts by the time it was made', () => {
    const earlier = uuidv7(1_000, ones);
    const later = uuidv7(1_001, zeros);

    expect(earlier < later).toBe(true);
  });
});

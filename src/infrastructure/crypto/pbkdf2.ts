import QuickCrypto from 'react-native-quick-crypto';

const { Buffer } = QuickCrypto;

/**
 * PBKDF2-SHA256 iterations for new password verifiers. Measured on the emulator (2026-11-04):
 * ~150 ms; a low-end phone is expected to be 5–10× slower. Each verifier keeps its own count, so
 * this can be raised later without breaking saved ones.
 */
export const PBKDF2_ITERATIONS = 310_000;

const KEY_LENGTH = 32;

/** PBKDF2-SHA256 of a password, in native code and off the JS thread. Hex in, hex out. */
export function pbkdf2Sha256Hex(
  password: string,
  saltHex: string,
  iterations: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    QuickCrypto.pbkdf2(
      password,
      Buffer.from(saltHex, 'hex'),
      iterations,
      KEY_LENGTH,
      'sha256',
      (error, key) => {
        if (error || !key) reject(error ?? new Error('PBKDF2 returned no key'));
        else resolve(key.toString('hex'));
      },
    );
  });
}

/** Random bytes from the platform's secure generator, as hex. */
export function randomHex(bytes: number): string {
  return QuickCrypto.randomBytes(bytes).toString('hex');
}

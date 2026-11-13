import { randomHex } from './pbkdf2';

/**
 * A UUID v7: the first 48 bits are the time in ms, the rest is random. Ids made later sort
 * later, so the censuses of a phone keep their order in any list or index.
 */
export function uuidv7(
  now: number = Date.now(),
  random: (bytes: number) => string = randomHex,
): string {
  const time = Math.floor(now).toString(16).padStart(12, '0');
  const noise = random(10);
  // The variant: the two top bits of this digit are 10.
  const variant = ((parseInt(noise[3], 16) & 0x3) | 0x8).toString(16);

  return [
    time.slice(0, 8),
    time.slice(8, 12),
    `7${noise.slice(0, 3)}`,
    `${variant}${noise.slice(4, 7)}`,
    noise.slice(7, 19),
  ].join('-');
}

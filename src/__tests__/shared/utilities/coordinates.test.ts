import { coordinatesText, formatAccuracy } from '@/src/shared/utilities/coordinates';

describe('coordinates', () => {
  it('writes latitude first, with six decimals', () => {
    expect(coordinatesText([-65.2975, -24.1852])).toBe('-24.185200, -65.297500');
  });

  it('rounds the accuracy to whole metres, never below 1', () => {
    expect(formatAccuracy(7.6)).toBe('± 8 m');
    expect(formatAccuracy(0.3)).toBe('± 1 m');
  });
});

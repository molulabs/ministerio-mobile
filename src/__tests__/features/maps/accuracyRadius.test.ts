import { accuracyRadius } from '@/src/features/maps/accuracyRadius';

/** The radius at a zoom, as MapLibre interpolates it. */
function radiusAt(expression: ReturnType<typeof accuracyRadius>, zoom: number) {
  const [, , , z0, r0, z1, r1] = expression;
  return r0 * 2 ** (((zoom - z0) / (z1 - z0)) * Math.log2(r1 / r0));
}

describe('accuracyRadius', () => {
  it('is as wide as the accuracy in metres, at any zoom', () => {
    // At the equator, zoom 15: 40 075 016.686 m / (512 · 2^15) ≈ 2.389 m per pixel.
    expect(radiusAt(accuracyRadius(10, 0), 15)).toBeCloseTo(10 / 2.389, 2);
    expect(radiusAt(accuracyRadius(10, 0), 16)).toBeCloseTo((2 * 10) / 2.389, 2);
  });

  it('grows with the latitude, as mercator stretches the map', () => {
    const jujuy = radiusAt(accuracyRadius(10, -24.2), 15);
    expect(jujuy).toBeCloseTo(10 / (2.389 * Math.cos((24.2 * Math.PI) / 180)), 2);
  });
});

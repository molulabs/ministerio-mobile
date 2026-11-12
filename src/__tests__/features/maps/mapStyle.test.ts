import { buildStyle, pickOfflineMap } from '@/src/features/maps/mapStyle';
import type { InstalledMapPackage } from '@/src/infrastructure/sync/maps.puller';

const tiles: InstalledMapPackage = {
  id: 'jujuy-base',
  kind: 'vector',
  version: '1',
  name: 'jujuy-base-1.pmtiles',
  bounds: [-67, -24, -64, -21],
  minzoom: 0,
  maxzoom: 15,
  attribution: '© OpenStreetMap',
  requires: [],
};
const style: InstalledMapPackage = {
  ...tiles,
  id: 'estilo',
  kind: 'style',
  name: 'estilo-1',
  bounds: null,
  attribution: null,
  requires: ['jujuy-base'],
};

describe('pickOfflineMap', () => {
  it('needs the style and every package it reads', () => {
    expect(pickOfflineMap([style])).toBeNull();
    expect(pickOfflineMap([tiles])).toBeNull();
    expect(pickOfflineMap([tiles, style])).toEqual({ style, used: [tiles] });
  });
});

describe('buildStyle', () => {
  const template = JSON.stringify({
    version: 8,
    glyphs: '@@STYLE_DIR@@/glyphs/{fontstack}/{range}.pbf',
    sources: { base: { type: 'vector', url: 'pmtiles://@@PACKAGE:jujuy-base@@' } },
    layers: [],
  });

  it('points the sources and glyphs to the files on the phone', () => {
    const built = buildStyle(template, 'file:///maps/estilo-1', {
      'jujuy-base': 'file:///maps/jujuy-base-1.pmtiles',
    });

    expect(built.glyphs).toBe('file:///maps/estilo-1/glyphs/{fontstack}/{range}.pbf');
    expect(built.sources.base).toEqual({
      type: 'vector',
      url: 'pmtiles://file:///maps/jujuy-base-1.pmtiles',
    });
  });

  it('fails when the style reads a package that is not installed', () => {
    expect(() => buildStyle(template, 'file:///maps/estilo-1', {})).toThrow('jujuy-base');
  });
});

import type { StyleSpecification } from '@maplibre/maplibre-react-native';

import type { InstalledMapPackage } from '@/src/infrastructure/sync/maps.puller';

export type OfflineMap = {
  style: StyleSpecification;
  /** west, south, east, north: the area the packages cover. */
  bounds: [number, number, number, number] | null;
  attributions: string[];
};

/**
 * The installed style and the packages it reads, or null while any of them is missing (the map
 * was never downloaded on this phone).
 */
export function pickOfflineMap(packages: InstalledMapPackage[]) {
  const style = packages.find((map) => map.kind === 'style');
  if (!style) return null;
  const used = style.requires.map((id) => packages.find((map) => map.id === id));
  if (used.some((map) => map === undefined)) return null;
  return { style, used: used as InstalledMapPackage[] };
}

/**
 * Fills the style template the build left with placeholders: @@PACKAGE:<id>@@ becomes the
 * file:// URI of that package (read with pmtiles://) and @@STYLE_DIR@@ the directory the style
 * was unzipped to, where its glyphs are.
 */
export function buildStyle(
  template: string,
  styleDirUri: string,
  packageUris: Record<string, string>,
): StyleSpecification {
  const filled = template
    .replaceAll('@@STYLE_DIR@@', styleDirUri)
    .replace(/@@PACKAGE:([a-z0-9][a-z0-9-]*)@@/g, (_, id: string) => {
      const uri = packageUris[id];
      if (!uri) throw new Error(`The style reads the map package ${id}, which is not installed`);
      return uri;
    });
  return JSON.parse(filled) as StyleSpecification;
}

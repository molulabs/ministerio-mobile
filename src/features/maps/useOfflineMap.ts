import { useEffect, useState } from 'react';

import { mapUri, readStyleTemplate } from '@/src/infrastructure/maps/mapFiles';
import { useInstalledMapPackages } from '@/src/infrastructure/sync/maps.store';

import { buildStyle, type OfflineMap, pickOfflineMap } from './mapStyle';

/**
 * The offline map ready to show, null until its packages are installed. Follows the database:
 * a new version of the map replaces the shown one when it finishes installing.
 */
export function useOfflineMap(): { map: OfflineMap | null; error: boolean } {
  const packages = useInstalledMapPackages();
  const picked = pickOfflineMap(packages);
  // The versions identify what is installed: the style is only read again when they change.
  const key = picked
    ? [picked.style, ...picked.used].map((p) => `${p.id}@${p.version}`).join()
    : '';
  const [state, setState] = useState<{ key: string; map: OfflineMap | null; error: boolean }>({
    key: '',
    map: null,
    error: false,
  });

  useEffect(() => {
    if (!picked) return;
    let current = true;
    const { style, used } = picked;
    readStyleTemplate(style.name)
      .then((template) => {
        const uris = Object.fromEntries(used.map((map) => [map.id, mapUri(map.name)]));
        const map: OfflineMap = {
          style: buildStyle(template, mapUri(style.name), uris),
          bounds: used.find((map) => map.bounds)?.bounds ?? null,
          attributions: used.flatMap((map) => (map.attribution ? [map.attribution] : [])),
        };
        if (current) setState({ key, map, error: false });
      })
      .catch(() => {
        if (current) setState({ key, map: null, error: true });
      });
    return () => {
      current = false;
    };
    // picked is derived from key: reading again on every render would reload the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state.key === key && key !== '' ? state : { map: null, error: false };
}

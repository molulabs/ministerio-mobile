import { Icon } from '@molulabs/ds/native';

import { LOCATION_COLOR } from './LocationPuck';

export type MapIconName = 'zoomIn' | 'zoomOut' | 'fit' | 'location';

/** The Tabler icon of each map button. */
const ICONS: Record<MapIconName, string> = {
  zoomIn: 'ti-plus',
  zoomOut: 'ti-minus',
  fit: 'ti-maximize',
  location: 'ti-current-location',
};

/** The icon of a map button; the location one in the colour of the position on the map. */
export function MapIcon({ name }: { name: MapIconName }) {
  return (
    <Icon
      name={ICONS[name]}
      size={26}
      color={name === 'location' ? LOCATION_COLOR : '#222'}
      // Android adds room above the glyph for accents: without it the icon sits low.
      style={{ includeFontPadding: false, textAlignVertical: 'center' }}
    />
  );
}

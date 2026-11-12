import { create } from 'zustand';

import type { DownloadProgress } from './maps.puller';

/**
 * The map download running now, for the map screen: progress only lives while it runs, so it is
 * kept in memory, not in SQLite.
 */
export const useMapDownload = create<{ progress: DownloadProgress | null }>(() => ({
  progress: null,
}));

export const setMapDownloadProgress = (progress: DownloadProgress | null) =>
  useMapDownload.setState({ progress });

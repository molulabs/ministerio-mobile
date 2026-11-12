import { Directory, DownloadTask, File, Paths } from 'expo-file-system';
import { unzipSync } from 'fflate';

import type { MapFiles, MapPackage } from '../sync/maps.puller';

/** Where the offline map lives: app storage, not cache, so Android never clears it. */
export const mapsDirectory = () => new Directory(Paths.document, 'maps');

/** A file being downloaded: only a complete, checked file gets the package's name. */
const PARTIAL = '.part';
/** A style being unzipped. */
const UNPACKING = '.tmp';

export class CorruptMapPackageError extends Error {
  constructor(id: string) {
    super(`The download of the map package ${id} does not match its size or SHA-256`);
    this.name = 'CorruptMapPackageError';
  }
}

/** The map packages on the phone's storage. */
export const mapFiles: MapFiles = {
  // A style is kept unzipped, in a directory named like its file without .zip.
  localName: (map) => (map.format === 'zip' ? map.file.replace(/\.zip$/, '') : map.file),

  async install(map, url, headers, onProgress) {
    const directory = mapsDirectory();
    directory.create({ intermediates: true, idempotent: true });
    const name = this.localName(map);
    const target =
      map.format === 'zip' ? new Directory(directory, name) : new File(directory, name);
    if (target.exists) return;

    const partial = new File(directory, map.file + PARTIAL);
    await download(map, url, partial, headers, onProgress);

    if (partial.size !== map.size || (await partial.digest('SHA-256')) !== map.sha256) {
      partial.delete();
      throw new CorruptMapPackageError(map.id);
    }

    if (map.format === 'zip') {
      await unpack(partial, directory, name);
      partial.delete();
    } else {
      partial.rename(name);
    }
  },

  async keepOnly(names) {
    const directory = mapsDirectory();
    if (!directory.exists) return;
    for (const entry of directory.list()) {
      if (!names.includes(entry.name)) entry.delete();
    }
  },
};

/**
 * Downloads to the partial file, going on from where a cut left it: the API (and S3, after its
 * redirect) answer a Range request with the rest. The resume data of Android is the byte offset.
 * iOS keeps opaque resume data instead: this has to change when the app is built for it.
 */
async function download(
  map: MapPackage,
  url: string,
  partial: File,
  headers: Record<string, string>,
  onProgress: (bytes: number) => void,
): Promise<void> {
  const have = partial.exists ? (partial.size ?? 0) : 0;
  if (have === map.size) return;
  if (have > map.size) partial.delete();

  const options = {
    headers,
    onProgress: ({ bytesWritten }: { bytesWritten: number }) => onProgress(bytesWritten),
  };
  const task =
    have > 0 && have < map.size
      ? DownloadTask.fromSavable(
          { url, fileUri: partial.uri, isDirectory: false, resumeData: String(have) },
          options,
        )
      : File.createDownloadTask(url, partial, options);

  try {
    await (task.state === 'paused' ? task.resumeAsync() : task.downloadAsync());
  } finally {
    task.release();
  }
}

/** Unzips the style next to its final name and renames it when every file is written. */
async function unpack(zip: File, directory: Directory, name: string): Promise<void> {
  const unpacking = new Directory(directory, name + UNPACKING);
  if (unpacking.exists) unpacking.delete();
  unpacking.create();

  for (const [path, content] of Object.entries(unzipSync(await zip.bytes()))) {
    if (path.endsWith('/')) continue;
    const segments = path.split('/');
    // The zip comes checked against the manifest, but a path must never leave the directory.
    if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
      throw new Error(`Unexpected path in the style zip: ${path}`);
    }
    const file = new File(unpacking, ...segments);
    file.create({ intermediates: true, overwrite: true });
    await file.write(content);
  }

  unpacking.rename(name);
}

/** The file:// URI of a name in the maps directory, without a trailing slash. */
export function mapUri(name: string): string {
  return new File(mapsDirectory(), name).uri.replace(/\/$/, '');
}

/** The style.json template of an installed style. */
export function readStyleTemplate(name: string): Promise<string> {
  return new File(mapsDirectory(), name, 'style.json').text();
}

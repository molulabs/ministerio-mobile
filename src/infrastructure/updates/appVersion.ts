import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

/** What the phone runs: the APK's version and, if one arrived, the OTA update on top of it. */
export type AppVersion = {
  version: string;
  /** null while the app runs the JS that came in the APK (or in development). */
  update: { id: string; createdAt: Date | null } | null;
};

/** The first characters of an update id: enough to tell updates apart on the screen. */
const SHORT_ID = 7;

export function appVersion(): AppVersion {
  const version = Constants.expoConfig?.version ?? '?';
  if (!Updates.isEnabled || Updates.isEmbeddedLaunch || !Updates.updateId) {
    return { version, update: null };
  }
  return {
    version,
    update: { id: Updates.updateId.slice(0, SHORT_ID), createdAt: Updates.createdAt },
  };
}

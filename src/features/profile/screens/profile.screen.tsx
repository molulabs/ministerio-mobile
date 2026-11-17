import { AlertBanner, Button, Card, Dialog, KeyValueList } from '@molulabs/ds';
import { useState } from 'react';

import type { AppVersion } from '@/src/infrastructure/updates/appVersion';
import { texts } from '@/src/shared/constants/texts';
import { Screen } from '@/src/shared/ui/Screen';
import { Text } from '@/src/shared/ui/Text';

interface ProfileScreenProps {
  firstname: string;
  lastname: string;
  email: string;
  /** The phone checked the password, without signal. */
  offline: boolean;
  /** Epoch ms of the last finished sync, or null if it never ran. */
  lastSyncAt: number | null;
  /** The user's censuses that have not gone out: signing out asks first when there are any. */
  unsentCount: number;
  /** What the phone runs: the APK's version and the OTA update, if any. */
  appVersion: AppVersion;
  onSignOut: () => Promise<void>;
}

/** The user comes in by props: features do not import each other (src/app wires them). */
export function ProfileScreen({
  firstname,
  lastname,
  email,
  offline,
  lastSyncAt,
  unsentCount,
  appVersion,
  onSignOut,
}: ProfileScreenProps) {
  const [signingOut, setSigningOut] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const signOut = async () => {
    setConfirming(false);
    setSigningOut(true);
    await onSignOut();
  };

  return (
    <Screen scroll>
      <Text variant="title">{texts.profile.greeting(firstname)}</Text>
      {offline && (
        <AlertBanner tone="info" icon="ti-wifi-off" title={texts.profile.offlineTitle}>
          {texts.profile.offlineMode}
        </AlertBanner>
      )}
      <Card>
        <KeyValueList
          items={[
            { k: texts.profile.name, v: `${firstname} ${lastname}` },
            { k: texts.profile.email, v: email },
            { k: texts.profile.lastSync, v: texts.profile.lastSyncValue(lastSyncAt) },
            {
              k: texts.profile.version,
              v: texts.profile.versionValue(appVersion.version, appVersion.update),
            },
          ]}
        />
      </Card>
      <Button
        tone="secondary"
        icon="ti-logout"
        // The icon is a character of the icon font: without a label it would be read as part of the name.
        aria-label={signingOut ? texts.profile.signingOut : texts.profile.signOut}
        disabled={signingOut}
        onClick={() => (unsentCount > 0 ? setConfirming(true) : void signOut())}
      >
        {signingOut ? texts.profile.signingOut : texts.profile.signOut}
      </Button>
      {/* Nothing is lost by signing out, but another user cannot send them: the owner must come back. */}
      <Dialog
        open={confirming}
        title={texts.profile.unsentTitle}
        confirmLabel={texts.profile.unsentConfirm}
        cancelLabel={texts.profile.unsentCancel}
        onConfirm={() => void signOut()}
        onCancel={() => setConfirming(false)}
      >
        {texts.profile.unsent(unsentCount)}
      </Dialog>
    </Screen>
  );
}

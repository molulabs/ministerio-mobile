import { AlertBanner, Button, Card, KeyValueList } from '@molulabs/ds';
import { useState } from 'react';

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
  onSignOut: () => Promise<void>;
}

/** The user comes in by props: features do not import each other (src/app wires them). */
export function ProfileScreen({
  firstname,
  lastname,
  email,
  offline,
  lastSyncAt,
  onSignOut,
}: ProfileScreenProps) {
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
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
          ]}
        />
      </Card>
      <Button
        tone="secondary"
        icon="ti-logout"
        // The icon is a character of the icon font: without a label it would be read as part of the name.
        aria-label={signingOut ? texts.profile.signingOut : texts.profile.signOut}
        disabled={signingOut}
        onClick={() => void signOut()}
      >
        {signingOut ? texts.profile.signingOut : texts.profile.signOut}
      </Button>
    </Screen>
  );
}

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { texts } from '@/src/shared/constants/texts';

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
    <View style={styles.container}>
      <Text style={styles.greeting}>{texts.profile.greeting(firstname)}</Text>
      <Text style={styles.detail}>
        {firstname} {lastname}
      </Text>
      <Text style={styles.detail}>{email}</Text>
      {offline && <Text style={styles.offline}>{texts.profile.offlineMode}</Text>}
      <Text style={styles.lastSync}>{texts.profile.lastSync(lastSyncAt)}</Text>
      <Pressable
        style={[styles.button, signingOut && styles.buttonDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: signingOut }}
        onPress={signOut}
        disabled={signingOut}
      >
        <Text style={styles.buttonText}>
          {signingOut ? texts.profile.signingOut : texts.profile.signOut}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  detail: {
    fontSize: 15,
    color: '#555',
  },
  offline: {
    marginTop: 16,
    fontSize: 14,
    color: '#9a6700',
    backgroundColor: '#fff8c5',
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
  },
  lastSync: {
    marginTop: 16,
    fontSize: 13,
    color: '#666',
  },
  button: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#cf222e',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#cf222e',
    fontSize: 16,
    fontWeight: '600',
  },
});

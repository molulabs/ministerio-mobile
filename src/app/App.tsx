import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { LoginScreen } from '@/src/features/auth/screens/login.screen';
import { useSession } from '@/src/features/auth/session.store';
import { ProfileScreen } from '@/src/features/profile/screens/profile.screen';

/** Until navigation arrives, the session decides which screen is shown. */
export default function App() {
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);
  const restore = useSession((state) => state.restore);
  const signOut = useSession((state) => state.signOut);

  useEffect(() => {
    restore();
  }, [restore]);

  return (
    <>
      {status === 'restoring' && (
        <View style={styles.restoring}>
          <ActivityIndicator size="large" />
        </View>
      )}
      {status === 'signedOut' && <LoginScreen />}
      {status === 'signedIn' && user && (
        <ProfileScreen
          firstname={user.firstname}
          lastname={user.lastname}
          email={user.email}
          onSignOut={signOut}
        />
      )}
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  restoring: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

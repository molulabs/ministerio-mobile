import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '@/src/features/auth/screens/login.screen';
import { useSession } from '@/src/features/auth/session.store';

import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * The session decides which screens exist: signed out there is only Login, signed in only the
 * tabs. Signing in or out swaps them, so the back button can never return to the other side.
 */
export function RootStack() {
  const signedIn = useSession((state) => state.status === 'signedIn');

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {signedIn ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

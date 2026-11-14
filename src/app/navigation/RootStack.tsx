import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { LoginScreen } from '@/src/features/auth/screens/login.screen';
import { useSession } from '@/src/features/auth/session.store';
import { CensusFormScreen } from '@/src/features/census/form/census-form.screen';

import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** The census form gets its draft and the session user from here: features do not navigate. */
function CensusFormRoute({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'CensusForm'>) {
  const userId = useSession((state) => state.user?.id);
  if (userId === undefined) return null;
  return (
    <CensusFormScreen id={route.params.id} userId={userId} onClose={() => navigation.goBack()} />
  );
}

/**
 * The session decides which screens exist: signed out there is only Login, signed in only the
 * tabs. Signing in or out swaps them, so the back button can never return to the other side.
 */
export function RootStack() {
  const signedIn = useSession((state) => state.status === 'signedIn');

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {signedIn ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="CensusForm" component={CensusFormRoute} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

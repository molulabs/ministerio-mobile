import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useSession } from '@/src/features/auth/session.store';
import { CensusListScreen } from '@/src/features/census/screens/census-list.screen';
import { MapScreen } from '@/src/features/maps/screens/map.screen';
import { ProfileScreen } from '@/src/features/profile/screens/profile.screen';
import { syncKeys, useSyncState } from '@/src/infrastructure/sync/syncState';
import { texts } from '@/src/shared/constants/texts';

import type { MainTabsParamList } from './routes';

const Tab = createBottomTabNavigator<MainTabsParamList>();

/** Features do not import each other: the profile gets the session user and sync state from here. */
function ProfileTab() {
  const user = useSession((state) => state.user);
  const mode = useSession((state) => state.mode);
  const signOut = useSession((state) => state.signOut);
  const lastSyncAt = useSyncState(syncKeys.lastSyncAt);
  if (!user) return null;
  return (
    <ProfileScreen
      firstname={user.firstname}
      lastname={user.lastname}
      email={user.email}
      offline={mode === 'offline'}
      lastSyncAt={lastSyncAt === null ? null : Number(lastSyncAt)}
      onSignOut={signOut}
    />
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      backBehavior="firstRoute"
      screenOptions={{
        // No icon set yet: the tabs show their label only.
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 15 },
      }}
    >
      <Tab.Screen
        name="Census"
        component={CensusListScreen}
        options={{ title: texts.tabs.census }}
      />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: texts.tabs.map }} />
      <Tab.Screen name="Profile" component={ProfileTab} options={{ title: texts.tabs.profile }} />
    </Tab.Navigator>
  );
}

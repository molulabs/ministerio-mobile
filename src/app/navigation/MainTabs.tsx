import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useSession } from '@/src/features/auth/session.store';
import { saveReadyCensus } from '@/src/features/census/census.repository';
import { CensusListScreen } from '@/src/features/census/screens/census-list.screen';
import { testCensusPayload } from '@/src/features/census/testCensus';
import { HomeScreen } from '@/src/features/home/screens/home.screen';
import { MapScreen } from '@/src/features/maps/screens/map.screen';
import { ProfileScreen } from '@/src/features/profile/screens/profile.screen';
import { syncKeys, useSyncState } from '@/src/infrastructure/sync/syncState';
import { texts } from '@/src/shared/constants/texts';

import { sendCensusesNow } from '../sync';
import { AppHeader, AppTabBar } from './AppTabBar';
import type { MainTabsParamList } from './routes';

const Tab = createBottomTabNavigator<MainTabsParamList>();

function HomeTab() {
  const firstname = useSession((state) => state.user?.firstname);
  // The catalogs are what the census form needs offline; the home only gets a yes or no.
  const catalogsSyncedAt = useSyncState(syncKeys.catalogsSyncedAt);
  if (!firstname) return null;
  return <HomeScreen firstname={firstname} offlineDataMissing={catalogsSyncedAt === null} />;
}

function CensusTab() {
  const userId = useSession((state) => state.user?.id);
  // Only in development builds: a release build never makes made-up censuses.
  const createTestCensus =
    __DEV__ && userId !== undefined
      ? async () => void (await saveReadyCensus(userId, testCensusPayload()))
      : undefined;
  return <CensusListScreen onSend={sendCensusesNow} onCreateTestCensus={createTestCensus} />;
}

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
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ header: (props) => <AppHeader {...props} /> }}
    >
      {/* First tab, so the app opens here. Revisit when the census list exists. */}
      <Tab.Screen name="Home" component={HomeTab} options={{ title: texts.tabs.home }} />
      <Tab.Screen name="Census" component={CensusTab} options={{ title: texts.tabs.census }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: texts.tabs.map }} />
      <Tab.Screen name="Profile" component={ProfileTab} options={{ title: texts.tabs.profile }} />
    </Tab.Navigator>
  );
}

import { useNavigation } from '@react-navigation/native';
import { type BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { SessionUser } from '@/src/features/auth/auth.model';
import { useSession } from '@/src/features/auth/session.store';
import {
  createDraft,
  saveReadyCensus,
  useCensuses,
  useUnsentCount,
} from '@/src/features/census/census.repository';
import { emptyCensusValues, toCensusPayload } from '@/src/features/census/form/censusForm.model';
import { CensusListScreen } from '@/src/features/census/list/census-list.screen';
import { testCensusPayload } from '@/src/features/census/testCensus';
import { MapScreen } from '@/src/features/maps/screens/map.screen';
import { ProfileScreen } from '@/src/features/profile/screens/profile.screen';
import { syncKeys, useSyncState } from '@/src/infrastructure/sync/syncState';
import { texts } from '@/src/shared/constants/texts';

import { sendCensusesNow } from '../sync';
import { AppHeader, AppTabBar } from './AppTabBar';
import type { MainTabsParamList } from './routes';

const Tab = createBottomTabNavigator<MainTabsParamList>();

function CensusTab() {
  const userId = useSession((state) => state.user?.id);
  if (userId === undefined) return null;
  return <UserCensuses userId={userId} />;
}

/** The census list of the signed-in user: a census is only ever shown to whoever took it. */
function UserCensuses({ userId }: { userId: number }) {
  const navigation = useNavigation();
  const censuses = useCensuses(userId);
  // The catalogs are what the census form needs without signal.
  const catalogsSyncedAt = useSyncState(syncKeys.catalogsSyncedAt);
  // Only in development builds: a release build never makes made-up censuses.
  const createTestCensus = __DEV__
    ? async () => void (await saveReadyCensus(userId, testCensusPayload()))
    : undefined;
  return (
    <CensusListScreen
      censuses={censuses}
      offlineDataMissing={catalogsSyncedAt === null}
      onNewCensus={async () => {
        const id = await createDraft(userId, toCensusPayload(emptyCensusValues(new Date())));
        navigation.navigate('CensusForm', { id });
      }}
      onOpenDraft={(id) => navigation.navigate('CensusForm', { id })}
      onSend={sendCensusesNow}
      onCreateTestCensus={createTestCensus}
    />
  );
}

/** Features do not import each other: the profile gets the session user and sync state from here. */
function ProfileTab() {
  const user = useSession((state) => state.user);
  if (!user) return null;
  return <UserProfile user={user} />;
}

function UserProfile({ user }: { user: SessionUser }) {
  const mode = useSession((state) => state.mode);
  const signOut = useSession((state) => state.signOut);
  const lastSyncAt = useSyncState(syncKeys.lastSyncAt);
  const unsentCount = useUnsentCount(user.id);
  return (
    <ProfileScreen
      firstname={user.firstname}
      lastname={user.lastname}
      email={user.email}
      offline={mode === 'offline'}
      lastSyncAt={lastSyncAt === null ? null : Number(lastSyncAt)}
      unsentCount={unsentCount}
      onSignOut={signOut}
    />
  );
}

/** The tabs, with the user's censuses not sent yet on the census tab. */
function TabBarWithCounts({ userId, ...props }: BottomTabBarProps & { userId: number }) {
  const unsent = useUnsentCount(userId);
  return <AppTabBar {...props} badges={{ Census: unsent }} />;
}

export function MainTabs() {
  // Only shown signed in: the session decides which screens exist.
  const userId = useSession((state) => state.user?.id);
  if (userId === undefined) return null;
  return (
    <Tab.Navigator
      // The app opens on the census list, the enumerator's work; back from any tab returns there.
      initialRouteName="Census"
      backBehavior="initialRoute"
      tabBar={(props) => <TabBarWithCounts {...props} userId={userId} />}
      screenOptions={{ header: (props) => <AppHeader {...props} /> }}
    >
      <Tab.Screen name="Census" component={CensusTab} options={{ title: texts.tabs.census }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: texts.tabs.map }} />
      <Tab.Screen name="Profile" component={ProfileTab} options={{ title: texts.tabs.profile }} />
    </Tab.Navigator>
  );
}

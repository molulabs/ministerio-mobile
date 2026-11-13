import { AppBar, TabBar } from '@molulabs/ds';
import type { BottomTabBarProps, BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/src/features/auth/session.store';
import { useReachable } from '@/src/infrastructure/network/network.monitor';
import { texts } from '@/src/shared/constants/texts';

import type { MainTabsParamList } from './routes';
import { useTabBarHeight } from './tabBarHeight';

/** The Tabler icon of each tab. */
export const TAB_ICONS: Record<keyof MainTabsParamList, string> = {
  Census: 'ti-clipboard-list',
  Map: 'ti-map',
  Profile: 'ti-user',
};

type AppTabBarProps = BottomTabBarProps & {
  /** A count on a tab's icon, e.g. the censuses not sent yet; 0 shows nothing. */
  badges?: Partial<Record<keyof MainTabsParamList, number>>;
};

/** The tabs as the design system draws them, clear of the gesture bar. */
export function AppTabBar({ state, descriptors, navigation, badges = {} }: AppTabBarProps) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index];
  const setHeight = useTabBarHeight((store) => store.setHeight);
  // Signing out removes the tabs: the toasts go back down.
  useEffect(() => () => setHeight(0), [setHeight]);

  return (
    // Measured, so the toasts sit above it (the design system's TabBar takes no onLayout).
    <View onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
      <TabBar
        items={state.routes.map((route) => ({
          key: route.key,
          label: descriptors[route.key].options.title ?? route.name,
          icon: TAB_ICONS[route.name as keyof MainTabsParamList],
          badge: badges[route.name as keyof MainTabsParamList] || undefined,
        }))}
        current={current.key}
        onNavigate={(key) => {
          const route = state.routes.find((item) => item.key === key);
          if (!route) return;
          const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
          if (route.key !== current.key && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }}
        style={{ paddingBottom: insets.bottom }}
      />
    </View>
  );
}

/**
 * Why the phone cannot send now, or nothing when it can: no signal, or a session opened without
 * signal, which has no tokens until the user signs in again online.
 */
export function connectionNotice(
  reachable: boolean | null,
  mode: 'online' | 'offline' | null,
): string | undefined {
  if (reachable === false) return texts.connection.noSignal;
  if (mode === 'offline') return texts.connection.offlineSession;
  return undefined;
}

/** The top bar of a tab, under the status bar, saying when the phone cannot send. */
export function AppHeader({ options, route }: BottomTabHeaderProps) {
  const insets = useSafeAreaInsets();
  const reachable = useReachable();
  const mode = useSession((state) => state.mode);
  return (
    <>
      {/* The bar is the dark chrome: the status bar icons go light over it. */}
      <StatusBar style="light" />
      <AppBar
        title={options.title ?? route.name}
        sub={connectionNotice(reachable, mode)}
        style={{ paddingTop: 8 + insets.top }}
      />
    </>
  );
}

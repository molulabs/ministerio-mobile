import type { NavigatorScreenParams } from '@react-navigation/native';

/** Route names and their params, so TypeScript catches a navigation to a screen that does not exist. */
export type MainTabsParamList = {
  Home: undefined;
  Census: undefined;
  Map: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabsParamList>;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

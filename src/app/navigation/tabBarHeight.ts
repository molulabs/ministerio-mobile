import { create } from 'zustand';

type TabBarHeight = { height: number; setHeight: (height: number) => void };

/**
 * The height of the tab bar on screen, 0 while it is not shown (the login). The toasts are drawn
 * above the navigation, so they read it here to stay clear of the tabs.
 */
export const useTabBarHeight = create<TabBarHeight>((set) => ({
  height: 0,
  setHeight: (height) => set({ height }),
}));

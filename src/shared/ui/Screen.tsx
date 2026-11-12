import { useTokens } from '@molulabs/ds/native';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

type Props = {
  children?: ReactNode;
  /** Centres the content on the screen, for a screen with little in it. */
  centered?: boolean;
  /** Scrolls the content, for a screen that may not fit (a form with the keyboard up). */
  scroll?: boolean;
};

/** The page of a screen: the design system's background and side padding. */
export function Screen({ children, centered = false, scroll = false }: Props) {
  const t = useTokens();
  const content = {
    flexGrow: 1,
    padding: t.space7,
    gap: t.space7,
    justifyContent: centered ? ('center' as const) : ('flex-start' as const),
  };

  if (scroll) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: t.page }}
        contentContainerStyle={content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[{ flex: 1, backgroundColor: t.page }, content]}>{children}</View>;
}

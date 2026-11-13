import { fontFamily, useTokens } from '@molulabs/ds/native';
import type { ReactNode } from 'react';
import { Text as NativeText, type TextProps } from 'react-native';

type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'muted' | 'small';

type Props = Omit<TextProps, 'children'> & {
  /** Default "body". */
  variant?: Variant;
  children?: ReactNode;
};

/**
 * Text of a screen in the design system's faces. React Native does not inherit fonts and the
 * design system keeps its own text component internal, so screens write through this one.
 */
export function Text({ variant = 'body', style, ...rest }: Props) {
  const t = useTokens();
  const variants = {
    // The heading of a screen of its own, as the login (the web's --ui-display)
    display: {
      fontSize: t.uiDisplayMin,
      lineHeight: Math.round(t.uiDisplayMin * t.leadingTight),
      color: t.ink,
      weight: t.weightSemibold,
    },
    title: { fontSize: t.uiTitle, color: t.ink, weight: t.weightSemibold },
    subtitle: {
      fontSize: t.uiTextLg,
      lineHeight: Math.round(t.uiTextLg * t.leadingTight),
      color: t.ink2,
      weight: t.weightRegular,
    },
    body: { fontSize: t.uiText, color: t.ink, weight: t.weightRegular },
    muted: { fontSize: t.uiText, color: t.ink2, weight: t.weightRegular },
    small: { fontSize: t.uiTextSm, color: t.ink3, weight: t.weightRegular },
  } as const;
  const { weight, ...look } = variants[variant];

  return (
    <NativeText
      {...rest}
      style={[{ ...look, fontFamily: fontFamily(t.sans, weight) }, style]}
      accessibilityRole={
        variant === 'display' || variant === 'title' ? 'header' : rest.accessibilityRole
      }
    />
  );
}

import type { TextStyle } from 'react-native';

/** Raw font sizes (legacy scale, aligned to the design system). */
export const font = {
  hero: 28,
  title: 24,
  heading: 18,
  body: 14,
  caption: 12,
  small: 11,
} as const;

type Token = Pick<TextStyle, 'fontSize' | 'fontWeight'>;

export const typography = {
  pageTitle: { fontSize: 24, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  videoTitle: { fontSize: 15, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  button: { fontSize: 14, fontWeight: '600' },
} as const satisfies Record<string, Token>;

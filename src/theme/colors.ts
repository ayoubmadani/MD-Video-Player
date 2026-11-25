// MD Video Player — Design System v1.0 (Dark Green · Rounded · Comfortable · Minimal)
export const colors = {
  background: '#101412',
  surface: '#1A211C',
  surfaceElevated: '#263229',

  primary: '#22C55E',
  primaryPressed: '#16A34A',
  primarySoft: '#163B26',
  /** Text/icons placed on `primary` (and other bright fills like `warning`). */
  onPrimary: '#07130B',

  textPrimary: '#F3F7F4',
  textSecondary: '#9AA79D',
  textDisabled: '#647067',

  border: '#303A33',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',

  playerBackground: '#080A09',
  overlay: 'rgba(0, 0, 0, 0.65)',
  /** Translucent `background` for blurred bars (tab bar). */
  backdrop: 'rgba(16, 20, 18, 0.6)',
  /** Muted dark green/gray progress-bar track. */
  progressTrack: '#2C3830',
} as const;

export type ColorToken = keyof typeof colors;

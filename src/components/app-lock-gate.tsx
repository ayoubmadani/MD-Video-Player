import { useEffect, useRef } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PinPad } from '@/components/pin-pad';
import { markUnlocked, relock, useLockState, verifyPin } from '@/features/lock/lock';
import { colors } from '@/theme';

/** Re-lock only after this long in the background, so pickers/permission dialogs don't re-prompt. */
const RELOCK_AFTER_MS = 60_000;

/** Full-screen PIN prompt over the whole app while "Lock app" is on and the session is locked. */
export function AppLockGate() {
  const { config, loaded, appUnlocked } = useLockState();
  const insets = useSafeAreaInsets();
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        backgroundedAt.current = Date.now();
      } else if (next === 'active' && backgroundedAt.current != null) {
        const away = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (away >= RELOCK_AFTER_MS) relock();
      }
    });
    return () => sub.remove();
  }, []);

  if (!loaded || !config.lockApp || appUnlocked) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <PinPad
        title="MD Player is locked"
        subtitle="Enter your PIN"
        onComplete={async (pin) => {
          const ok = await verifyPin(pin);
          if (ok) markUnlocked('app');
          return ok;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
});

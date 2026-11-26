import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PinPad } from '@/components/pin-pad';
import { markUnlocked, useLockState, verifyPin } from '@/features/lock/lock';
import { colors } from '@/theme';

/** Shows a PIN prompt instead of `children` while "Lock TV channels" is on and not yet unlocked. */
export function TvLockGate({ children, canGoBack = false }: { children: ReactNode; canGoBack?: boolean }) {
  const { config, tvUnlocked } = useLockState();
  const insets = useSafeAreaInsets();
  if (!config.lockTv || tvUnlocked) return <>{children}</>;
  return (
    <View style={[styles.wrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <PinPad
        title="TV channels are locked"
        subtitle="Enter your PIN"
        onComplete={async (pin) => {
          const ok = await verifyPin(pin);
          if (ok) markUnlocked('tv');
          return ok;
        }}
        onCancel={canGoBack ? () => router.back() : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
});

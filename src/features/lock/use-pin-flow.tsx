import { useCallback, useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PinPad } from '@/components/pin-pad';
import { colors } from '@/theme';

import { removePin, setLockFlag, setPin, verifyPin } from './lock';

type Step = { title: string; subtitle?: string; onPin: (pin: string) => Promise<boolean> };

/**
 * Drives the multi-step PIN dialogs for Settings (set, change, remove, turn a lock off).
 * Returns action handlers plus the modal element to render once in the screen.
 */
export function usePinFlow() {
  const [step, setStep] = useState<Step | null>(null);
  const [stepKey, setStepKey] = useState(0);
  const firstPin = useRef('');
  const insets = useSafeAreaInsets();

  const show = useCallback((next: Step | null) => {
    setStep(next);
    setStepKey((k) => k + 1);
  }, []);

  /** Ask for the current PIN, then run `then` (which may open further steps). */
  const verifyThen = useCallback(
    (then: () => void | Promise<void>) => {
      show({
        title: 'Enter current PIN',
        onPin: async (pin) => {
          if (!(await verifyPin(pin))) return false;
          show(null);
          await then();
          return true;
        },
      });
    },
    [show],
  );

  const chooseNewPin = useCallback(() => {
    show({
      title: 'Choose a 4-digit PIN',
      onPin: async (pin) => {
        firstPin.current = pin;
        show({
          title: 'Confirm your PIN',
          subtitle: 'Enter the same PIN again',
          onPin: async (confirm) => {
            if (confirm !== firstPin.current) return false;
            await setPin(confirm);
            show(null);
            return true;
          },
        });
        return true;
      },
    });
  }, [show]);

  const changePin = useCallback(() => verifyThen(chooseNewPin), [verifyThen, chooseNewPin]);
  const deletePin = useCallback(() => verifyThen(removePin), [verifyThen]);

  /** Turning a lock on is free; turning it off needs the PIN. */
  const toggleLock = useCallback(
    (which: 'app' | 'tv', on: boolean) => {
      if (on) setLockFlag(which, true).catch(() => undefined);
      else verifyThen(() => setLockFlag(which, false));
    },
    [verifyThen],
  );

  const modal = (
    <Modal visible={!!step} animationType="slide" onRequestClose={() => show(null)} statusBarTranslucent>
      <View style={[styles.sheet, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {step ? (
          <PinPad
            key={stepKey}
            title={step.title}
            subtitle={step.subtitle}
            onComplete={step.onPin}
            onCancel={() => show(null)}
          />
        ) : null}
      </View>
    </Modal>
  );

  return { chooseNewPin, changePin, deletePin, toggleLock, modal };
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
});

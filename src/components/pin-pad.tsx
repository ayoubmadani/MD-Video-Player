import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { PIN_LENGTH } from '@/features/lock/lock';
import { colors, font, radius, spacing, typography } from '@/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

/**
 * 4-digit PIN entry. Give it a different `key` to reset it between steps (e.g. new PIN → confirm). `onComplete` gets the PIN once all digits are typed; return false to
 * show the error state (shake + clear), true to accept.
 */
export function PinPad({
  title,
  subtitle,
  onComplete,
  onCancel,
}: {
  title: string;
  subtitle?: string;
  onComplete: (pin: string) => Promise<boolean> | boolean;
  onCancel?: () => void;
}) {
  const [pin, setPin] = useState('');
  const pinRef = useRef('');
  const [error, setError] = useState(false);
  const busy = useRef(false);
  const [shake] = useState(() => new Animated.Value(0));

  const submit = useCallback(
    async (value: string) => {
      busy.current = true;
      const ok = await onComplete(value);
      busy.current = false;
      if (!ok) {
        setError(true);
        Animated.sequence(
          [10, -10, 8, -8, 0].map((toValue) =>
            Animated.timing(shake, { toValue, duration: 50, useNativeDriver: true }),
          ),
        ).start();
        pinRef.current = '';
        setPin('');
      }
    },
    [onComplete, shake],
  );

  const press = useCallback(
    (key: (typeof KEYS)[number]) => {
      if (busy.current || !key) return;
      setError(false);
      const current = pinRef.current;
      const next = key === 'del' ? current.slice(0, -1) : current.length >= PIN_LENGTH ? current : current + key;
      pinRef.current = next;
      setPin(next);
      if (key !== 'del' && next.length === PIN_LENGTH && current.length < PIN_LENGTH) submit(next);
    },
    [submit],
  );

  return (
    <View style={styles.wrap}>
      <Ionicons name="lock-closed" size={28} color={colors.primary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.subtitle, error && { color: colors.error }]}>
        {error ? 'Wrong PIN — try again' : (subtitle ?? ' ')}
      </Text>

      <Animated.View style={[styles.dots, { transform: [{ translateX: shake }] }]}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled, error && styles.dotError]} />
        ))}
      </Animated.View>

      <View style={styles.grid}>
        {KEYS.map((key, i) =>
          key ? (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={key === 'del' ? 'Delete' : key}
              onPress={() => press(key)}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}>
              {key === 'del' ? (
                <Ionicons name="backspace-outline" size={24} color={colors.textPrimary} />
              ) : (
                <Text style={styles.keyText}>{key}</Text>
              )}
            </Pressable>
          ) : (
            <View key={i} style={styles.keyBlank} />
          ),
        )}
      </View>

      {onCancel ? (
        <Pressable onPress={onCancel} hitSlop={12} style={styles.cancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const KEY_SIZE = 72;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.base,
    marginVertical: spacing.xl,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.textSecondary,
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotError: {
    borderColor: colors.error,
  },
  grid: {
    width: KEY_SIZE * 3 + spacing.xl * 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.base,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    backgroundColor: colors.surfaceElevated,
  },
  keyBlank: {
    width: KEY_SIZE,
    height: KEY_SIZE,
  },
  keyText: {
    color: colors.textPrimary,
    fontSize: font.title,
    fontWeight: '500',
  },
  cancel: {
    marginTop: spacing.xl,
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
});

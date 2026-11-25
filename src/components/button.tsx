import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, layout, radius, spacing, typography } from '@/theme';

export function Button({
  label,
  onPress,
  variant = 'primary',
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && (pressed ? styles.primaryPressed : styles.primary),
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        pressed && variant !== 'primary' && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
        style,
      ]}>
      <Text
        style={[
          styles.label,
          variant === 'primary' && { color: colors.onPrimary },
          variant === 'ghost' && { color: colors.textSecondary },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.buttonHeight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  label: {
    ...typography.button,
    color: colors.textPrimary,
  },
});

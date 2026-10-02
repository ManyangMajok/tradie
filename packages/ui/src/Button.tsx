import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, radii, spacing, gradients } from './tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}: Props) {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[styles.base, fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={[styles.primaryText, textStyle]}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<Exclude<Variant, 'primary'>, ViewStyle> = {
    secondary: styles.secondary,
    ghost: styles.ghost,
    danger: styles.danger,
  };

  const variantTextStyles: Record<Exclude<Variant, 'primary'>, TextStyle> = {
    secondary: styles.secondaryText,
    ghost: styles.ghostText,
    danger: styles.dangerText,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[styles.base, fullWidth && styles.fullWidth, variantStyles[variant], isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Text style={[styles.baseText, variantTextStyles[variant], textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.full,
    overflow: 'hidden',
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.xl,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.xl,
  },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: spacing.xl,
  },
  baseText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodyLg,
  },
  primaryText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.bodyLg,
    color: colors.background,
  },
  secondaryText: { color: colors.primary },
  ghostText: { color: colors.primaryLight },
  dangerText: { color: '#EF4444' },
});

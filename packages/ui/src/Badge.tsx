import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, radii } from './tokens';

type Variant = 'emergency' | 'sameDay' | 'scheduled' | 'active' | 'completed' | 'primary' | 'gold' | 'error';

const variantMap: Record<Variant, { bg: string; text: string }> = {
  emergency: { bg: colors.errorContainer, text: colors.error },
  sameDay:   { bg: colors.tertiaryContainer, text: colors.tertiary },
  scheduled: { bg: 'rgba(96,165,250,0.15)', text: '#60A5FA' },
  active:    { bg: `${colors.primary}20`, text: colors.primaryLight },
  completed: { bg: `${colors.outline}20`, text: colors.onSurfaceVariant },
  primary:   { bg: `${colors.primary}20`, text: colors.primary },
  gold:      { bg: `${colors.tertiary}20`, text: colors.tertiary },
  error:     { bg: `${colors.error}20`, text: colors.error },
};

interface Props {
  label: string;
  variant?: Variant;
  style?: ViewStyle;
  uppercase?: boolean;
}

export function Badge({ label, variant = 'primary', style, uppercase = false }: Props) {
  const { bg, text } = variantMap[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>
        {uppercase ? label.toUpperCase() : label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.labelCaps,
    letterSpacing: typography.letterSpacings.labelCaps,
  },
});

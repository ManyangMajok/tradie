import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing } from './tokens';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

// Glassmorphic card: rgba surface + white border top/left + inner highlight
export function GlassCard({ children, style, padding = spacing.lg }: Props) {
  return (
    <View style={[styles.card, { padding }, style]}>
      <View style={styles.highlight} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.xl,
    pointerEvents: 'none',
  },
});

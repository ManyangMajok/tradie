import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing } from '@tradify/ui';

// spec §11.1 — checks tokens, routes to Onboarding or Tabs

export function SplashScreen() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <View style={styles.container}>
      {/* Ambient glows */}
      <View style={[styles.glow, styles.glowTopLeft]} />
      <View style={[styles.glow, styles.glowBottomRight]} />

      {/* Logo ring */}
      <View style={styles.logoRing}>
        <View style={styles.logoInner}>
          <Text style={styles.logoMark}>T</Text>
        </View>
      </View>

      <Text style={styles.wordmark}>Tradify</Text>
      <Text style={styles.tagline}>For Members</Text>

      <ActivityIndicator
        color={colors.primary}
        size="small"
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.12,
  },
  glowTopLeft: {
    top: -80,
    left: -80,
    backgroundColor: colors.secondary,
  },
  glowBottomRight: {
    bottom: -80,
    right: -80,
    backgroundColor: colors.primary,
  },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: `${colors.primary}40`,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}25`,
    borderWidth: 1,
    borderColor: `${colors.primary}60`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    fontFamily: typography.fonts.bold,
    fontSize: 28,
    color: colors.primaryLight,
  },
  wordmark: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.onSurface,
    marginTop: spacing.xl,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  spinner: {
    marginTop: spacing.section,
  },
});

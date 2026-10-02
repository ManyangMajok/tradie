import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing } from '@tradify/ui';

// Stitch ref: docs/stitch/splash_auth_check/
// Dark full-screen, centered logo ring + app name + spinner
export function SplashScreen() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <View style={styles.container}>
      {/* Ambient glow top-right */}
      <View style={styles.glowTopRight} pointerEvents="none" />
      {/* Ambient glow bottom-left */}
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      {/* Logo ring */}
      <View style={styles.logoRing}>
        <View style={styles.logoInner}>
          <Text style={styles.logoLetter}>T</Text>
        </View>
      </View>

      <Text style={styles.appName}>TRADIFY</Text>
      <Text style={styles.tagline}>INITIALIZING</Text>

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
  glowTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: `${colors.primary}12`,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: `${colors.secondaryContainer}08`,
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: `${colors.primary}50`,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}10`,
    marginBottom: spacing.xl,
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontFamily: typography.fonts.bold,
    fontSize: 28,
    color: colors.primaryLight,
  },
  appName: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.primaryLight,
    letterSpacing: 6,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.labelCaps,
    color: colors.onSurfaceVariant,
    letterSpacing: typography.letterSpacings.labelCaps,
    marginBottom: spacing.xxl,
  },
  spinner: {
    marginTop: spacing.md,
  },
});

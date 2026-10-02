import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, colors, typography, spacing } from '@tradify/ui';
import { demoWebUrl } from '@tradify/shared';

export function OnboardingScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();


  return (
    <View style={styles.container}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <View style={[styles.content, { marginTop: insets.top + spacing.xxl }]}>
        <View style={styles.imagePlaceholder}>
          <View style={styles.logoRing}>
            <Text style={styles.logoMark}>T</Text>
          </View>
        </View>

        <View style={styles.textStack}>
          <Text style={styles.title}>Welcome to Tradify</Text>
          <Text style={styles.subtitle}>
            Choose local Kenyan fundis by service area and rating.
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
        <Button
          label="Sign In"
          onPress={() => navigation.navigate('Login')}
          fullWidth
          style={styles.button}
        />
        <Button
          label="Join the Kenyan demo"
          variant="secondary"
          onPress={() => Linking.openURL(demoWebUrl('/register/member'))}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  glow: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.08,
  },
  glowTop: { top: -100, right: -100, backgroundColor: colors.primary },
  glowBottom: { bottom: -100, left: -100, backgroundColor: colors.secondary },
  content: { flex: 1, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholder: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: `${colors.surface}80`,
    borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  logoRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, borderColor: `${colors.primary}60`,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center', justifyContent: 'center',
  },
  logoMark: {
    fontFamily: typography.fonts.bold, fontSize: 32, color: colors.primaryLight,
  },
  textStack: { alignItems: 'center', gap: spacing.sm },
  title: {
    fontFamily: typography.fonts.bold, fontSize: typography.sizes.h2,
    color: colors.onSurface, textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyLg,
    color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 24,
  },
  footer: { paddingHorizontal: spacing.xl, gap: spacing.md },
  button: {},
});

import React, { useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap, Shield, Calendar } from 'lucide-react-native';
import { Button, GlassCard, colors, typography, spacing } from '@tradify/ui';
import { useAuthStore } from '../../store/authStore';

// Stitch ref: docs/stitch/onboarding_step_1/, onboarding_step_2/, onboarding_step_3/

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: Zap,
    title: 'Leads arrive fast',
    body: 'Members choose you from nearby fundis. Keep the demo app open or refresh Leads to see requests.',
    cta: 'Next',
  },
  {
    icon: Shield,
    title: "You're in control",
    body: 'Accept or decline every lead. Set your service areas and categories so only relevant jobs reach you.',
    cta: 'Next',
  },
  {
    icon: Calendar,
    title: 'Set your availability',
    body: 'Tell us when you work. Jobs only get dispatched to you during your available hours.',
    cta: 'Get Started',
  },
] as const;

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const markOnboardingDone = useAuthStore((s) => s.markOnboardingDone);

  async function complete() {
    await markOnboardingDone();
    // Navigator reacts to isOnboardingDone state change and routes to Tabs automatically
  }

  async function handleCta() {
    if (activeIndex === 0) {
      listRef.current?.scrollToIndex({ index: 1 });
      setActiveIndex(1);
      return;
    }
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      await complete();
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background glows */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      {/* Skip */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={complete}
        accessibilityLabel="Skip onboarding"
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        scrollEnabled={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => {
          const Icon = item.icon;
          return (
            <View style={styles.slide}>
              <GlassCard style={styles.card}>
                <View style={styles.iconWrap}>
                  <Icon size={40} color={colors.primaryLight} strokeWidth={1.5} />
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </GlassCard>
            </View>
          );
        }}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          label={SLIDES[activeIndex].cta}
          onPress={handleCta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: `${colors.primary}10`,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${colors.secondaryContainer}08`,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  skipText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodySm,
    color: colors.primaryLight,
  },
  slide: {
    width,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    flex: 1,
  },
  card: {
    alignItems: 'center',
    paddingVertical: spacing.section,
    paddingHorizontal: spacing.xxl,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.lineHeights.h2,
  },
  body: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: typography.lineHeights.bodyLg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.outline,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
});

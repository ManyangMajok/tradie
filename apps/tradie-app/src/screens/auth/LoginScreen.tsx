import { demoWebUrl } from '@tradify/shared';
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '@tradify/shared';
import { Button, GlassCard, colors, typography, spacing, radii } from '@tradify/ui';

// The navigator reacts to token state changes automatically — no explicit navigation needed here.

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  async function handleLogin() {
    if (!email.trim() || !password || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.login(email.trim().toLowerCase(), password, 'Tradify Tradie App', 'tradie');
      await setAuth(data.access_token, data.refresh_token, data.user);
      // Navigator automatically routes to Onboarding (first time) or Tabs
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setError(e?.response?.data?.message ?? 'This account is not authorised for the Tradie app.');
      } else if (e?.response?.status === 401 || e?.response?.status === 422) {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError('Could not reach server. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Glow */}
        <View style={styles.glow} pointerEvents="none" />

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to your tradie account</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.outline}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.outline}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword
                ? <EyeOff size={18} color={colors.outline} />
                : <Eye size={18} color={colors.outline} />}
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
        </GlassCard>

        <Button
          label="Sign In"
          onPress={handleLogin}
          loading={loading}
          disabled={!email.trim() || !password}
          style={styles.btn}
        />

        <TouchableOpacity
          style={styles.forgotWrap}
          onPress={() => Linking.openURL(demoWebUrl('/password/forgot'))}
        >
          <Text style={styles.forgot}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerWrap}
          onPress={() => Linking.openURL(demoWebUrl('/register/tradie/step-1'))}
        >
          <Text style={styles.registerText}>
            Not registered?{' '}
            <Text style={styles.registerLink}>Sign up as a tradie</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    paddingHorizontal: spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: 40,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: `${colors.primary}10`,
  },
  heading: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h1,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  sub: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.labelCaps,
    color: colors.onSurfaceVariant,
    letterSpacing: typography.letterSpacings.labelCaps,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: `${colors.surfaceContainer}80`,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  passwordInput: {
    flex: 1,
  },
  eyeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: spacing.md,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.error,
  },
  btn: {
    marginTop: spacing.sm,
  },
  forgotWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  forgot: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.primaryLight,
  },
  registerWrap: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  registerText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
  },
  registerLink: {
    fontFamily: typography.fonts.semiBold,
    color: colors.primaryLight,
  },
});

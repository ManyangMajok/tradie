import { demoWebUrl } from '@tradify/shared';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import { GlassCard, Button, colors, typography, spacing } from '@tradify/ui';
import { authApi } from '@tradify/shared';
import { useAuthStore } from '../../store/authStore';

// spec §11.2

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const deviceName = `${Platform.OS} device`;
      const { data: res } = await authApi.login(email.trim().toLowerCase(), password, deviceName, 'member');
      if (res.user.role !== 'member') {
        setError('This account is for tradies. Download the Tradify Tradies app to access your account.');
        return;
      }
      await setAuth(res.access_token, res.refresh_token, res.user);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError(err.response.data.message ?? 'Use the correct app for your account.');
      } else if (err?.response?.status === 401) {
        setError('Wrong email or password.');
      } else if (err?.response?.status === 422) {
        setError('Wrong email or password.');
      } else {
        setError("Couldn't reach Tradify. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.section, paddingBottom: insets.bottom + spacing.section }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoRing}>
            <Text style={styles.logoMark}>T</Text>
          </View>
          <Text style={styles.wordmark}>Tradify</Text>
          <Text style={styles.tagline}>Member portal</Text>
        </View>

        {/* Form */}
        <GlassCard style={styles.form}>
          <Text style={styles.formTitle}>Sign in</Text>

          <View style={styles.field}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              placeholder="you@example.com"
              placeholderTextColor={colors.outline}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              textContentType="emailAddress"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.pwRow}>
              <TextInput
                style={[styles.input, styles.pwInput]}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(null); }}
                placeholder="••••••••"
                placeholderTextColor={colors.outline}
                secureTextEntry={!showPw}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                textContentType="password"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                {showPw
                  ? <EyeOff size={18} color={colors.outline} />
                  : <Eye size={18} color={colors.outline} />}
              </TouchableOpacity>
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            label="Sign in"
            onPress={handleLogin}
            loading={loading}
            disabled={!email.trim() || !password.trim()}
            fullWidth
            style={styles.submitBtn}
          />
        </GlassCard>

        {/* Aux links */}
        <TouchableOpacity
          onPress={() => Linking.openURL(demoWebUrl('/password/forgot'))}
          style={styles.auxLink}
        >
          <Text style={styles.auxLinkText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Linking.openURL(demoWebUrl('/register/member'))}
          style={styles.auxLink}
        >
          <Text style={styles.auxLinkText}>
            Not a member yet? <Text style={styles.auxLinkAccent}>Join Tradify</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  glow: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140, opacity: 0.1,
  },
  glowTop: { top: -60, right: -60, backgroundColor: colors.primary },
  glowBottom: { bottom: -60, left: -60, backgroundColor: colors.secondary },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  logoArea: { alignItems: 'center', gap: spacing.md },
  logoRing: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5, borderColor: `${colors.primary}40`,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  logoMark: {
    fontFamily: typography.fonts.bold, fontSize: 24, color: colors.primaryLight,
  },
  wordmark: {
    fontFamily: typography.fonts.bold, fontSize: typography.sizes.h2, color: colors.onSurface,
  },
  tagline: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant,
  },
  form: { gap: spacing.lg },
  formTitle: {
    fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  field: { gap: spacing.xs },
  label: {
    fontFamily: typography.fonts.bold, fontSize: typography.sizes.labelCaps,
    color: colors.onSurfaceVariant, letterSpacing: 0.96, textTransform: 'uppercase',
  },
  input: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyLg, color: colors.onSurface,
    borderBottomWidth: 1, borderBottomColor: colors.glassBorder,
    paddingVertical: spacing.sm,
  },
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  pwInput: { flex: 1 },
  eyeBtn: { padding: spacing.sm },
  error: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm,
    color: colors.error, lineHeight: 18,
  },
  submitBtn: { marginTop: spacing.xs },
  auxLink: { alignItems: 'center', paddingVertical: spacing.sm },
  auxLinkText: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant,
  },
  auxLinkAccent: { color: colors.primaryLight, fontFamily: typography.fonts.semiBold },
});

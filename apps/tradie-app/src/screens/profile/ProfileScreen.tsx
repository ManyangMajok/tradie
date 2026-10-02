import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin, Tag, Calendar, CreditCard, Lock, Bell, LogOut, ChevronRight, User,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { GlassCard, colors, typography, spacing, radii } from '@tradify/ui';
import { client } from '@tradify/shared';
import { useAuthStore } from '../../store/authStore';

// Stitch ref: docs/stitch/profile_settings/

interface CompanyProfile {
  business_name: string;
  trading_name: string | null;
  about_text: string | null;
  rating_average: number | null;
  rating_count: number;
}

function SectionRow({
  icon, label, value, onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>}
        {onPress && <ChevronRight size={16} color={colors.outline} />}
      </View>
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);

  const { data: company } = useQuery<CompanyProfile>({
    queryKey: ['tradie-profile'],
    queryFn: () => client.get<{ company: CompanyProfile | null }>('/api/v1/tradie/settings').then((r) => r.data.company ?? undefined),
  });

  async function doSignOut() {
    try {
      await client.post('/api/v1/auth/logout');
    } catch (_) {
      // Token may already be invalid — still clear local auth
    }
    await clearAuth();
    // Navigator reacts to token state change and routes to Login automatically
  }

  function handleSignOut() {
    Alert.alert('Sign out?', 'You will need to sign in again to receive leads.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: doSignOut },
    ]);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.first_name?.[0]?.toUpperCase() ?? 'T'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {company?.business_name ?? `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {company?.rating_average != null && (
              <Text style={styles.profileRating}>
                ★ {company.rating_average.toFixed(1)} · {company.rating_count} review{company.rating_count !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </GlassCard>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <GlassCard padding={0}>
            <SectionRow icon={<User size={16} color={colors.primary} />} label="Personal details" />
            <View style={styles.divider} />
            <SectionRow icon={<Lock size={16} color={colors.primary} />} label="Change password" />
          </GlassCard>
        </View>

        {/* Business */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BUSINESS</Text>
          <GlassCard padding={0}>
            <SectionRow
              icon={<MapPin size={16} color={colors.secondary} />}
              label="Service areas"
              onPress={() => nav.navigate('ServiceAreas')}
            />
            <View style={styles.divider} />
            <SectionRow
              icon={<Tag size={16} color={colors.secondary} />}
              label="Categories"
              onPress={() => nav.navigate('ServiceCategories')}
            />
            <View style={styles.divider} />
            <SectionRow
              icon={<Calendar size={16} color={colors.secondary} />}
              label="Availability"
              onPress={() => nav.navigate('Availability')}
            />
          </GlassCard>
        </View>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUBSCRIPTION</Text>
          <GlassCard padding={0}>
            <SectionRow
              icon={<CreditCard size={16} color={colors.tertiary} />}
              label="Subscription"
              onPress={() => nav.navigate('Subscription')}
            />
          </GlassCard>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <GlassCard padding={0}>
            <View style={styles.row}>
              <View style={styles.rowIcon}><Bell size={16} color={colors.onSurfaceVariant} /></View>
              <View style={styles.notifInfo}>
                <Text style={styles.rowLabel}>Lead notifications</Text>
                <Text style={styles.notifSub}>Required to receive leads</Text>
              </View>
              <Switch
                value={true}
                disabled
                thumbColor={colors.background}
                trackColor={{ false: colors.surfaceContainer, true: colors.primary }}
              />
            </View>
          </GlassCard>
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP</Text>
          <GlassCard padding={0}>
            <SectionRow icon={<Bell size={16} color={colors.outline} />} label="Report a problem" />
          </GlassCard>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut size={16} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Tradify Tradie · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(60,53,65,0.8)',
  },
  heading: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  content: { padding: spacing.xl, gap: spacing.xl },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: `${colors.primary}20`,
    borderWidth: 2, borderColor: `${colors.primary}40`,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontFamily: typography.fonts.bold, fontSize: 24, color: colors.primaryLight },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  profileEmail: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  profileRating: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodySm, color: colors.tertiary, marginTop: 4 },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.labelCaps,
    color: colors.onSurfaceVariant,
    letterSpacing: typography.letterSpacings.labelCaps,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowIcon: {
    width: 32, height: 32, borderRadius: radii.md,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyLg, color: colors.onSurface },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowValue: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant, maxWidth: 120 },
  notifInfo: { flex: 1 },
  notifSub: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.labelCaps, color: colors.outline, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginLeft: 64 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderWidth: 1, borderColor: `${colors.error}40`,
    borderRadius: radii.xl, padding: spacing.lg,
    justifyContent: 'center',
  },
  signOutText: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyLg, color: colors.error },
  version: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.labelCaps,
    color: colors.outline,
    textAlign: 'center',
  },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, CreditCard, HelpCircle, LogOut, User } from 'lucide-react-native';
import { GlassCard, colors, typography, spacing } from '@tradify/ui';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '@tradify/shared';

export function MoreScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
          try { await authApi.logout(); } catch (e) {}
          clearAuth();
        } 
      },
    ]);
  };

  const menuItems = [
    { icon: User, label: 'Account details', action: () => Alert.alert('Account details', `${user?.first_name ?? ''} ${user?.last_name ?? ''}\n${user?.email ?? ''}`) },
    { icon: Heart, label: 'Saved Tradies', action: () => navigation.navigate('SavedTradies') },
    { icon: CreditCard, label: 'Membership & Billing', action: () => navigation.navigate('Membership') },
    { icon: HelpCircle, label: 'Support & Help', action: () => Alert.alert('Demo help', 'Keep the local Laravel server running. Refresh screens to see updates. Ask your demo organiser for help.') },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 80 }]}>
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarInitial}>{user?.first_name?.[0]}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        <GlassCard style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={item.label} style={[styles.menuItem, index !== menuItems.length - 1 && styles.borderBottom]} onPress={item.action}>
              <View style={styles.menuIconWrap}>
                <item.icon size={20} color={colors.primaryLight} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </GlassCard>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${colors.primary}40` },
  avatarInitial: { fontFamily: typography.fonts.bold, fontSize: 28, color: colors.primaryLight },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  userEmail: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  menuIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.primary}10`, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyMd, color: colors.onSurface },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: `${colors.error}10`, borderRadius: 16, borderWidth: 1, borderColor: `${colors.error}30` },
  logoutText: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyMd, color: colors.error },
});

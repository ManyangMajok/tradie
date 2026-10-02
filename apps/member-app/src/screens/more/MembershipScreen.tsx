import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react-native';
import { GlassCard, Button, colors, typography, spacing } from '@tradify/ui';
import { memberApi } from '@tradify/shared';

export function MembershipScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembership() {
      try {
        const res = await memberApi.getMembership();
        setMembership(res);
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    loadMembership();
  }, []);

  const handlePortal = () => {
    Linking.openURL('https://tradify.au/membership');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Membership</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {!loading && membership ? (
          <GlassCard style={styles.card}>
            <View style={styles.statusHeader}>
              <Text style={styles.planName}>{membership.plan} Plan</Text>
              {membership.status === 'active' ? (
                <View style={styles.badgeActive}>
                  <Text style={styles.badgeTextActive}>Active</Text>
                </View>
              ) : (
                <View style={styles.badgeInactive}>
                  <Text style={styles.badgeTextInactive}>Inactive</Text>
                </View>
              )}
            </View>

            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Limit</Text>
                <Text style={styles.detailValue}>{membership.property_limit} properties</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next Billing</Text>
                <Text style={styles.detailValue}>
                  {membership.renews_at ? new Date(membership.renews_at).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>

            <Button
              label="Manage Membership"
              onPress={handlePortal}
              style={styles.manageBtn}
            />
          </GlassCard>
        ) : !loading ? (
          <GlassCard style={styles.card}>
            <View style={styles.alertIcon}>
              <AlertCircle size={32} color={colors.warning} />
            </View>
            <Text style={styles.noPlanTitle}>No Active Membership</Text>
            <Text style={styles.noPlanDesc}>You need an active membership to request tradies and manage properties.</Text>
            <Button label="Subscribe Now" onPress={handlePortal} style={styles.manageBtn} />
          </GlassCard>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  content: { padding: spacing.xl },
  card: { gap: spacing.lg },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.glassBorder, paddingBottom: spacing.md },
  planName: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h2, color: colors.onSurface, textTransform: 'capitalize' },
  badgeActive: { backgroundColor: `${colors.success}20`, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 12 },
  badgeTextActive: { fontFamily: typography.fonts.semiBold, fontSize: 12, color: colors.success, textTransform: 'uppercase' },
  badgeInactive: { backgroundColor: `${colors.error}20`, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 12 },
  badgeTextInactive: { fontFamily: typography.fonts.semiBold, fontSize: 12, color: colors.error, textTransform: 'uppercase' },
  detailsList: { gap: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyMd, color: colors.onSurfaceVariant },
  detailValue: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyMd, color: colors.onSurface },
  manageBtn: { marginTop: spacing.sm },
  alertIcon: { alignItems: 'center', marginBottom: spacing.sm },
  noPlanTitle: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface, textAlign: 'center' },
  noPlanDesc: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react-native';
import { GlassCard, Button, colors, typography, spacing } from '@tradify/ui';
import { memberApi } from '@tradify/shared';

export function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ active_jobs: 0, pending_reviews: 0, saved_tradies: 0, total_properties: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  async function loadDashboard() {
    try {
      const res = await memberApi.getDashboard();
      setStats(res.stats);
      setRecentJobs(res.recent_jobs);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.glow, styles.glowTop]} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>

        <GlassCard style={styles.quickActionCard}>
          <Text style={styles.quickActionTitle}>Need a tradie?</Text>
          <Text style={styles.quickActionDesc}>Get quotes from verified local professionals.</Text>
          <Button
            label="Post a Job"
            icon={<Plus size={18} color={colors.onPrimary} />}
            onPress={() => navigation.navigate('SubmitRequest')}
            style={styles.actionBtn}
          />
        </GlassCard>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.active_jobs}</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.total_properties}</Text>
            <Text style={styles.statLabel}>Properties</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.saved_tradies}</Text>
            <Text style={styles.statLabel}>Saved Tradies</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Jobs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Jobs')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.jobsList}>
          {recentJobs.length === 0 && !loading ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent jobs.</Text>
            </GlassCard>
          ) : (
            recentJobs.map((job) => (
              <TouchableOpacity key={job.id} onPress={() => navigation.navigate('JobDetail', { publicId: job.public_id })}>
                <GlassCard style={styles.jobCard}>
                  <View style={styles.jobTop}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.jobStatus}>{job.status}</Text>
                  </View>
                  <Text style={styles.jobDesc} numberOfLines={2}>{job.description}</Text>
                  <View style={styles.jobBottom}>
                    <Clock size={14} color={colors.outline} />
                    <Text style={styles.jobDate}>{new Date(job.created_at).toLocaleDateString()}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.1 },
  glowTop: { top: -100, right: -50, backgroundColor: colors.primary },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  header: { gap: spacing.xs },
  greeting: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyMd, color: colors.onSurfaceVariant },
  title: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h1, color: colors.onSurface },
  quickActionCard: { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30`, gap: spacing.sm },
  quickActionTitle: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  quickActionDesc: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant },
  actionBtn: { marginTop: spacing.xs },
  statsGrid: { flexDirection: 'row', gap: spacing.md },
  statBox: { flex: 1, backgroundColor: `${colors.surface}80`, borderRadius: 12, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  statVal: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h2, color: colors.onSurface },
  statLabel: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyXs, color: colors.onSurfaceVariant, marginTop: spacing.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  sectionTitle: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.h4, color: colors.onSurface },
  seeAll: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodySm, color: colors.primaryLight },
  jobsList: { gap: spacing.md },
  emptyCard: { alignItems: 'center', padding: spacing.xl },
  emptyText: { fontFamily: typography.fonts.regular, color: colors.outline },
  jobCard: { gap: spacing.sm },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobTitle: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyLg, color: colors.onSurface, flex: 1 },
  jobStatus: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyXs, color: colors.primaryLight, textTransform: 'uppercase' },
  jobDesc: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant },
  jobBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  jobDate: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyXs, color: colors.outline },
});

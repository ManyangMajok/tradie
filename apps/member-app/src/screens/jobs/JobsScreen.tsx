import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ChevronRight, Clock } from 'lucide-react-native';
import { GlassCard, Button, colors, typography, spacing, radii } from '@tradify/ui';
import { memberApi } from '@tradify/shared';

export function JobsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadJobs() {
    try {
      const res = await memberApi.getJobs();
      setJobs(res);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadJobs();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const renderJob = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => navigation.navigate('JobDetail', { publicId: item.public_id })}>
      <GlassCard style={styles.jobCard}>
        <View style={styles.jobTop}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.jobStatus}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.jobDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.jobBottom}>
          <View style={styles.dateRow}>
            <Clock size={14} color={colors.outline} />
            <Text style={styles.jobDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
          <ChevronRight size={18} color={colors.outline} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>My Jobs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('SubmitRequest')}>
          <Plus size={20} color={colors.primaryLight} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderJob}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No jobs yet</Text>
              <Text style={styles.emptyDesc}>When you submit a request for a tradie, your jobs will appear here.</Text>
              <Button label="Post a Job" onPress={() => navigation.navigate('SubmitRequest')} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  title: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h2, color: colors.onSurface },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing.xl, gap: spacing.md },
  jobCard: { gap: spacing.sm },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobTitle: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyLg, color: colors.onSurface, flex: 1 },
  statusBadge: { backgroundColor: `${colors.primary}15`, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  jobStatus: { fontFamily: typography.fonts.semiBold, fontSize: 10, color: colors.primaryLight, textTransform: 'uppercase' },
  jobDesc: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant },
  jobBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  jobDate: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyXs, color: colors.outline },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: spacing.md },
  emptyTitle: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  emptyDesc: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.lg, paddingHorizontal: spacing.xl },
});

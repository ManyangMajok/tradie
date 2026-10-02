import React, { useState } from 'react';
import {
  View, Text, SectionList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Briefcase } from 'lucide-react-native';
import { GlassCard, Badge, colors, typography, spacing, radii } from '@tradify/ui';
import { client, type Job, JOB_STATUS_LABELS } from '@tradify/shared';
import type { RootStackParamList } from '../../navigation/RootNavigator';

// Stitch ref: docs/stitch/jobs_inbox/

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Tab = 'active' | 'completed';

const ACTIVE_STATUSES = ['assigned', 'tradie_on_the_way', 'in_progress', 'completed', 'awaiting_client_response', 'rescheduled'];
const COMPLETE_STATUSES = ['confirmed', 'disputed', 'cancelled'];

function statusVariant(s: string): 'active' | 'completed' | 'error' {
  if (['assigned', 'tradie_on_the_way', 'in_progress'].includes(s)) return 'active';
  if (s === 'confirmed') return 'completed';
  return 'error';
}

function groupByDay(jobs: Job[]): { title: string; data: Job[] }[] {
  const groups: Record<string, Job[]> = {};
  for (const job of jobs) {
    const d = new Date(job.created_at);
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    let key: string;
    if (d.toDateString() === today.toDateString()) key = 'TODAY';
    else if (d.toDateString() === tomorrow.toDateString()) key = 'TOMORROW';
    else key = d.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();
    (groups[key] ??= []).push(job);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

export function JobsInboxScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>('active');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['tradie-jobs'],
    queryFn: () => client.get<{ data: Job[] }>('/api/v1/tradie/jobs').then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const filtered = (data ?? []).filter((j) =>
    tab === 'active' ? ACTIVE_STATUSES.includes(j.status) : COMPLETE_STATUSES.includes(j.status),
  );
  const sections = groupByDay(filtered);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>My Jobs</Text>
        {/* Segmented control */}
        <View style={styles.tabs}>
          {(['active', 'completed'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(j) => j.public_id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Briefcase size={32} color={colors.outline} strokeWidth={1.2} />
              <Text style={styles.emptyTitle}>No {tab} jobs</Text>
            </View>
          ) : null
        }
        renderItem={({ item: job }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => nav.navigate('JobDetail', { publicId: job.public_id })}>
            <GlassCard style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardLeft}>
                  <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                  <Text style={styles.jobMeta}>{job.suburb} · {job.category}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Badge
                    label={JOB_STATUS_LABELS[job.status] ?? job.status}
                    variant={statusVariant(job.status) as any}
                  />
                  <ChevronRight size={16} color={colors.outline} style={{ marginTop: spacing.sm }} />
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
      />
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
    gap: spacing.md,
  },
  heading: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: `${colors.primary}30`,
  },
  tabLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodySm,
    color: colors.outline,
  },
  tabLabelActive: { color: colors.primaryLight },
  list: { padding: spacing.xl, gap: spacing.sm },
  sectionHeader: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.labelCaps,
    color: colors.onSurfaceVariant,
    letterSpacing: typography.letterSpacings.labelCaps,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, marginRight: spacing.md },
  cardRight: { alignItems: 'flex-end' },
  jobTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
  },
  jobMeta: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Star, TrendingUp, Zap, CheckCircle, AlertTriangle, DollarSign, Clock } from 'lucide-react-native';
import { GlassCard, colors, typography, spacing, radii } from '@tradify/ui';
import { client, type PerformanceStats } from '@tradify/shared';

// Stitch ref: docs/stitch/performance_dashboard/

type Period = '7d' | '30d' | '90d';

interface StatTileProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
}

function StatTile({ label, value, icon, sub }: StatTileProps) {
  return (
    <GlassCard style={styles.tile}>
      <View style={styles.tileIcon}>{icon}</View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
      {sub && <Text style={styles.tileSub}>{sub}</Text>}
    </GlassCard>
  );
}

export function PerformanceScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('30d');

  const { data } = useQuery<PerformanceStats>({
    queryKey: ['performance', period],
    queryFn: () =>
      client
        .get<{ stats: Omit<PerformanceStats, 'rating_average' | 'rating_count'>; rating: { average: number | null; count: number } }>(
          `/api/v1/tradie/performance?range=${period}`,
        )
        .then((r) => ({
          ...r.data.stats,
          rating_average: r.data.rating.average,
          rating_count: r.data.rating.count,
        })),
  });

  const revenue = data
    ? (data.reported_revenue_cents / 100).toLocaleString('en-AU', {
        style: 'currency', currency: 'AUD', maximumFractionDigits: 0,
      })
    : '—';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Performance</Text>
        <View style={styles.filters}>
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.filterBtn, period === p && styles.filterBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.filterLabel, period === p && styles.filterLabelActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Rating hero */}
        <GlassCard style={styles.ratingCard}>
          <View style={styles.ratingRow}>
            <Star size={24} color={colors.tertiary} fill={colors.tertiary} />
            <Text style={styles.ratingValue}>
              {data?.rating_average != null ? data.rating_average.toFixed(1) : '—'}
            </Text>
            <Text style={styles.ratingCount}>
              {data?.rating_count ? `${data.rating_count} review${data.rating_count !== 1 ? 's' : ''}` : 'No reviews yet'}
            </Text>
          </View>
        </GlassCard>

        {/* Stats grid */}
        <View style={styles.grid}>
          <StatTile
            label="Leads Offered"
            value={String(data?.leads_offered ?? '—')}
            icon={<Zap size={18} color={colors.primaryLight} />}
          />
          <StatTile
            label="Acceptance Rate"
            value={data?.acceptance_rate != null ? `${data.acceptance_rate}%` : '—'}
            icon={<TrendingUp size={18} color={colors.secondary} />}
            sub={`${data?.leads_accepted ?? 0} accepted`}
          />
          <StatTile
            label="Jobs Completed"
            value={String(data?.jobs_completed ?? '—')}
            icon={<CheckCircle size={18} color="#34d399" />}
          />
          <StatTile
            label="Disputes"
            value={String(data?.jobs_disputed ?? '—')}
            icon={<AlertTriangle size={18} color={colors.error} />}
          />
          <StatTile
            label="Avg Response"
            value={data?.avg_response_minutes != null ? `${data.avg_response_minutes}m` : '—'}
            icon={<Clock size={18} color={colors.tertiary} />}
          />
          <StatTile
            label="Revenue"
            value={revenue}
            icon={<DollarSign size={18} color="#34d399" />}
            sub="Self-reported"
          />
        </View>
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
    gap: spacing.md,
  },
  heading: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  filters: { flexDirection: 'row', gap: spacing.sm },
  filterBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.xs,
    borderRadius: radii.full, borderWidth: 1, borderColor: colors.glassBorder,
  },
  filterBtnActive: { backgroundColor: `${colors.primary}25`, borderColor: `${colors.primary}60` },
  filterLabel: {
    fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodySm, color: colors.outline,
  },
  filterLabelActive: { color: colors.primaryLight },
  content: { padding: spacing.xl, gap: spacing.md },
  ratingCard: {},
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ratingValue: {
    fontFamily: typography.fonts.bold, fontSize: typography.sizes.h1, color: colors.onSurface,
  },
  ratingCount: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '47%',
    gap: spacing.xs,
  },
  tileIcon: {
    width: 36, height: 36, borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tileValue: {
    fontFamily: typography.fonts.bold, fontSize: typography.sizes.h2, color: colors.onSurface,
  },
  tileLabel: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant,
  },
  tileSub: {
    fontFamily: typography.fonts.regular, fontSize: 11, color: colors.outline,
  },
});

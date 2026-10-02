import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, Zap } from 'lucide-react-native';
import { GlassCard, Badge, colors, typography, spacing, radii } from '@tradify/ui';
import { client, type JobOffer } from '@tradify/shared';
import type { RootStackParamList } from '../../navigation/RootNavigator';

// Stitch ref: docs/stitch/leads_inbox/

type Nav = NativeStackNavigationProp<RootStackParamList>;

function urgencyVariant(u: string): 'emergency' | 'sameDay' | 'scheduled' {
  if (u === 'emergency') return 'emergency';
  if (u === 'same_day') return 'sameDay';
  return 'scheduled';
}

function urgencyLabel(u: string) {
  if (u === 'emergency') return 'EMERGENCY';
  if (u === 'same_day') return 'SAME DAY';
  if (u === 'within_48h') return 'WITHIN 48H';
  return 'FLEXIBLE';
}

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const mins = Math.floor(diff / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function LeadCard({ offer }: { offer: JobOffer }) {
  const nav = useNavigation<Nav>();
  const [, forceUpdate] = React.useReducer((n) => n + 1, 0);

  React.useEffect(() => {
    const id = setInterval(forceUpdate, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => nav.navigate('LeadDetail', { offerId: offer.public_id })}
    >
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Badge
            label={urgencyLabel(offer.job.urgency)}
            variant={urgencyVariant(offer.job.urgency)}
            uppercase
          />
          <View style={styles.timer}>
            <Clock size={12} color={colors.error} />
            <Text style={styles.timerText}>{timeRemaining(offer.expires_at)}</Text>
          </View>
        </View>

        <Text style={styles.jobTitle} numberOfLines={2}>{offer.job.title}</Text>

        <View style={styles.meta}>
          <MapPin size={12} color={colors.onSurfaceVariant} />
          <Text style={styles.metaText}>{offer.job.suburb}, {offer.job.state}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.category}>{offer.job.category}</Text>
          <Zap size={14} color={colors.primaryLight} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

export function LeadsInboxScreen() {
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leads'],
    queryFn: () => client.get<{ data: JobOffer[] }>('/api/v1/tradie/leads').then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const offers = data ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Leads Inbox</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={offers}
        keyExtractor={(o) => o.public_id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Zap size={32} color={colors.outline} strokeWidth={1.2} />
              <Text style={styles.emptyTitle}>No leads right now</Text>
              <Text style={styles.emptyBody}>New leads will appear here when a job matches your profile.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <LeadCard offer={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  onlineText: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    color: '#34d399',
  },
  list: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.errorContainer}60`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  timerText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.labelCaps,
    color: colors.error,
  },
  jobTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
    lineHeight: typography.lineHeights.bodyLg,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  category: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.labelCaps,
    color: colors.primaryLight,
    letterSpacing: typography.letterSpacings.labelCaps,
    textTransform: 'uppercase',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
  },
  emptyBody: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: typography.lineHeights.bodySm,
  },
});

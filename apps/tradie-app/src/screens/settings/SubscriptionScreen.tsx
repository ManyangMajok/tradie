import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, CheckCircle, AlertTriangle, ExternalLink, RefreshCcw } from 'lucide-react-native';
import { TopBar, GlassCard, colors, typography, spacing, radii } from '@tradify/ui';
import { client, type TradieSubscription } from '@tradify/shared';
import type { RootStackParamList } from '../../navigation/RootNavigator';

// Stitch ref: docs/stitch/subscription_status/ — spec §9.13

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

const PLAN_BENEFITS: Record<string, string[]> = {
  premium: [
    'Prioritised in dispatch scoring',
    'Featured in member search results',
    'Unlimited lead offers per month',
    'Performance dashboard with full history',
    'Priority support',
  ],
  standard: [
    'Standard dispatch scoring',
    'Up to 40 lead offers per month',
    'Performance dashboard (last 30 days)',
    'Email support',
  ],
};

function statusColor(status: TradieSubscription['status']) {
  if (status === 'active') return colors.primary;
  if (status === 'past_due') return colors.tertiary;
  return colors.error;
}

function statusLabel(status: TradieSubscription['status']) {
  if (status === 'active') return 'Active';
  if (status === 'past_due') return 'Payment overdue';
  if (status === 'cancelled') return 'Cancelled';
  return 'Expired';
}

export function SubscriptionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const { data: sub } = useQuery<TradieSubscription>({
    queryKey: ['tradie-subscription'],
    queryFn: () => client.get<{ data: TradieSubscription | null }>('/api/v1/tradie/subscription').then((r) => r.data.data ?? undefined),
  });

  const price = sub
    ? (sub.yearly_price_cents / 100).toLocaleString('en-AU', {
        style: 'currency', currency: 'AUD', maximumFractionDigits: 0,
      })
    : '—';

  const endDate = sub
    ? new Date(sub.end_date).toLocaleDateString('en-AU', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  const benefits =
    sub ? (PLAN_BENEFITS[sub.plan_slug] ?? PLAN_BENEFITS.standard) : [];

  const isInactive = sub && sub.status !== 'active';

  return (
    <View style={styles.container}>
      <TopBar
        title="Subscription"
        leftAction="back"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Inactive banner */}
        {isInactive && (
          <View style={[styles.banner, { borderColor: `${colors.error}40`, backgroundColor: `${colors.error}10` }]}>
            <AlertTriangle size={16} color={colors.error} />
            <Text style={styles.bannerText}>
              {sub.status === 'past_due'
                ? 'Your payment is overdue. Leads are paused until you update your billing.'
                : 'Your subscription is inactive. Leads are paused.'}
            </Text>
          </View>
        )}

        {/* Auto-renew off banner */}
        {sub?.status === 'active' && !sub.auto_renew && (
          <View style={[styles.banner, { borderColor: `${colors.tertiary}40`, backgroundColor: `${colors.tertiary}10` }]}>
            <RefreshCcw size={16} color={colors.tertiary} />
            <Text style={[styles.bannerText, { color: colors.tertiary }]}>
              Auto-renew is off. Your subscription will end on {endDate}.
            </Text>
          </View>
        )}

        {/* Plan card */}
        <GlassCard style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planIconWrap}>
              <CreditCard size={20} color={colors.primary} />
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{sub?.plan_name ?? '—'}</Text>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: sub ? statusColor(sub.status) : colors.outline }]} />
                <Text style={[styles.statusText, { color: sub ? statusColor(sub.status) : colors.outline }]}>
                  {sub ? statusLabel(sub.status) : '—'}
                </Text>
              </View>
            </View>
            <Text style={styles.planPrice}>{price}<Text style={styles.planPriceUnit}>/yr</Text></Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{sub?.auto_renew ? 'Renews on' : 'Expires on'}</Text>
            <Text style={styles.detailValue}>{endDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Auto-renew</Text>
            <Text style={[styles.detailValue, { color: sub?.auto_renew ? colors.primary : colors.outline }]}>
              {sub?.auto_renew ? 'On' : 'Off'}
            </Text>
          </View>
        </GlassCard>

        {/* Benefits */}
        {benefits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PLAN INCLUDES</Text>
            <GlassCard style={{ gap: spacing.sm }}>
              {benefits.map((b) => (
                <View key={b} style={styles.benefitRow}>
                  <CheckCircle size={14} color={colors.primary} />
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </GlassCard>
          </View>
        )}

        {/* Manage button */}
        <TouchableOpacity
          style={styles.manageBtn}
          onPress={() => Linking.openURL('https://tradify.au/tradie/subscription')}
          accessibilityLabel="Manage subscription on web"
        >
          <ExternalLink size={16} color={colors.primaryLight} />
          <Text style={styles.manageBtnText}>Manage subscription</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Subscription billing is handled securely through the Tradify website.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    borderWidth: 1, borderRadius: radii.xl,
    padding: spacing.lg,
  },
  bannerText: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.error,
    lineHeight: 20,
  },
  planCard: { gap: spacing.md },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  planIconWrap: {
    width: 44, height: 44, borderRadius: radii.lg,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center', justifyContent: 'center',
  },
  planInfo: { flex: 1 },
  planName: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.onSurface,
  },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodySm,
  },
  planPrice: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.onSurface,
  },
  planPriceUnit: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.glassBorder,
    paddingTop: spacing.md,
  },
  detailLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
  },
  detailValue: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurface,
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.labelCaps,
    color: colors.onSurfaceVariant,
    letterSpacing: typography.letterSpacings.labelCaps,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurface,
    flex: 1,
  },
  manageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderWidth: 1, borderColor: `${colors.primary}40`,
    borderRadius: radii.xl, padding: spacing.lg,
    justifyContent: 'center',
    backgroundColor: `${colors.primary}10`,
  },
  manageBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodyLg,
    color: colors.primaryLight,
  },
  note: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.outline,
    textAlign: 'center',
    lineHeight: 18,
  },
});

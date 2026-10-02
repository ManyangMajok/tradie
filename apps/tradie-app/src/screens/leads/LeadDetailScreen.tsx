import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert, Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, Home, XCircle, ChevronRight } from 'lucide-react-native';
import { TopBar, GlassCard, Badge, Button, colors, typography, spacing, radii } from '@tradify/ui';
import { client, type JobOffer } from '@tradify/shared';
import type { RootStackParamList } from '../../navigation/RootNavigator';

// Stitch ref: docs/stitch/lead_detail/

type Props = NativeStackScreenProps<RootStackParamList, 'LeadDetail'>;

const DECLINE_REASONS = [
  { key: 'too_far', label: 'Too far from my area' },
  { key: 'busy', label: 'Currently busy' },
  { key: 'not_my_work', label: 'Not the type of work I do' },
  { key: 'other', label: 'Other' },
];

function urgencyVariant(u: string): 'emergency' | 'sameDay' | 'scheduled' {
  if (u === 'emergency') return 'emergency';
  if (u === 'same_day') return 'sameDay';
  return 'scheduled';
}

function urgencyLabel(u: string) {
  const map: Record<string, string> = {
    emergency: 'EMERGENCY', same_day: 'SAME DAY',
    within_48h: 'WITHIN 48H', flexible: 'FLEXIBLE',
  };
  return map[u] ?? u.toUpperCase();
}

export function LeadDetailScreen({ navigation, route }: Props) {
  const { offerId } = route.params;
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showDeclineSheet, setShowDeclineSheet] = useState(false);

  const { data: offer, isLoading } = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => client.get<{ data: JobOffer }>(`/api/v1/tradie/leads/${offerId}`).then((r) => r.data.data),
  });

  useEffect(() => {
    if (!offer) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(offer.expires_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offer]);

  const accept = useMutation({
    mutationFn: () =>
      client.post<{ job_id: number; public_id: string }>(`/api/v1/tradie/leads/${offerId}/accept`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['tradie-jobs'] });
      navigation.replace('JobDetail', { publicId: res.data.public_id });
    },
    onError: (e: any) => {
      if (e?.response?.status === 410) {
        Alert.alert('Lead expired', 'Sorry, this lead has expired. Go back to find more leads.');
      } else if (e?.response?.status === 409) {
        Alert.alert('No longer available', 'Another tradie just accepted this lead. Go back to find more leads.');
      } else {
        Alert.alert('Error', 'Could not accept lead. Please try again.');
      }
    },
  });

  const decline = useMutation({
    mutationFn: (reason: string) =>
      client.post(`/api/v1/tradie/leads/${offerId}/decline`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Error', 'Could not decline lead. Please try again.');
    },
  });

  const timerMins = Math.floor(secondsLeft / 60);
  const timerSecs = secondsLeft % 60;
  const timerStr = `${timerMins}:${String(timerSecs).padStart(2, '0')}`;
  const isExpired = secondsLeft === 0 && offer != null;

  if (isLoading || !offer) {
    return (
      <View style={styles.container}>
        <TopBar title="Lead Detail" leftAction="back" onBack={() => navigation.goBack()} />
      </View>
    );
  }

  const { job } = offer;

  return (
    <View style={styles.container}>
      <TopBar
        title="Lead Detail"
        leftAction="back"
        onBack={() => navigation.goBack()}
        right={
          <View style={[styles.timerBadge, isExpired && styles.timerBadgeExpired]}>
            <Clock size={11} color={isExpired ? colors.outline : colors.error} />
            <Text style={[styles.timerText, isExpired && styles.timerTextExpired]}>
              {isExpired ? 'Expired' : timerStr}
            </Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgency */}
        <View style={styles.badgeRow}>
          <Badge label={urgencyLabel(job.urgency)} variant={urgencyVariant(job.urgency)} uppercase />
        </View>

        <Text style={styles.title}>{job.title}</Text>

        <View style={styles.metaRow}>
          <MapPin size={14} color={colors.onSurfaceVariant} />
          <Text style={styles.metaText}>{job.suburb} {job.postcode}, {job.state}</Text>
        </View>
        <View style={[styles.metaRow, { marginTop: 4 }]}>
          <Home size={14} color={colors.onSurfaceVariant} />
          <Text style={styles.metaText}>{job.category}{job.issue_type ? ` · ${job.issue_type}` : ''}</Text>
        </View>

        {/* Description */}
        <GlassCard style={styles.detailCard}>
          <Text style={styles.detailLabel}>DESCRIPTION</Text>
          <Text style={styles.description}>{job.description}</Text>
        </GlassCard>

        {/* Photos */}
        {job.photo_urls.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photos}>
            {job.photo_urls.map((url, i) => (
              <Image key={i} source={{ uri: url }} style={styles.photo} />
            ))}
          </ScrollView>
        )}

        {/* Timing */}
        <GlassCard style={styles.timingCard}>
          <Text style={styles.detailLabel}>SUBMITTED</Text>
          <Text style={styles.timingText}>
            {new Date(job.created_at).toLocaleString('en-AU')}
          </Text>
          <Text style={[styles.detailLabel, { marginTop: spacing.md }]}>OFFER EXPIRES</Text>
          <Text style={styles.timingText}>
            {new Date(offer.expires_at).toLocaleString('en-AU')}
          </Text>
        </GlassCard>
      </ScrollView>

      {/* Sticky actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.md }]}>
        {isExpired ? (
          <View style={styles.expiredBar}>
            <Text style={styles.expiredText}>This lead has expired</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => setShowDeclineSheet(true)}
              disabled={decline.isPending}
              accessibilityLabel="Decline lead"
            >
              <XCircle size={18} color={colors.error} />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>

            <Button
              label="Accept Lead"
              onPress={() => accept.mutate()}
              loading={accept.isPending}
              style={styles.acceptBtn}
              fullWidth={false}
            />
          </>
        )}
      </View>

      {/* Decline reason sheet */}
      <Modal
        visible={showDeclineSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeclineSheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Text style={styles.sheetTitle}>Why are you declining?</Text>
            <Text style={styles.sheetSub}>This helps us send better matches next time.</Text>

            {DECLINE_REASONS.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={styles.reasonRow}
                onPress={() => {
                  setShowDeclineSheet(false);
                  decline.mutate(r.key);
                }}
                accessibilityLabel={r.label}
              >
                <Text style={styles.reasonLabel}>{r.label}</Text>
                <ChevronRight size={16} color={colors.outline} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowDeclineSheet(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: `${colors.errorContainer}60`,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radii.full,
  },
  timerBadgeExpired: {
    backgroundColor: colors.surfaceContainer,
  },
  timerText: {
    fontFamily: typography.fonts.bold, fontSize: 11, color: colors.error,
  },
  timerTextExpired: {
    color: colors.outline,
  },
  content: { padding: spacing.xl },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  title: {
    fontFamily: typography.fonts.bold, fontSize: typography.sizes.h2,
    color: colors.onSurface, lineHeight: typography.lineHeights.h2,
    marginBottom: spacing.md,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant, flex: 1,
  },
  detailCard: { marginTop: spacing.xl },
  detailLabel: {
    fontFamily: typography.fonts.bold, fontSize: typography.sizes.labelCaps,
    color: colors.onSurfaceVariant, letterSpacing: typography.letterSpacings.labelCaps,
    textTransform: 'uppercase', marginBottom: spacing.sm,
  },
  description: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyLg,
    color: colors.onSurface, lineHeight: typography.lineHeights.bodyLg,
  },
  photos: { marginTop: spacing.lg },
  photo: {
    width: 140, height: 140, borderRadius: radii.xl,
    marginRight: spacing.md, backgroundColor: colors.surfaceContainer,
  },
  timingCard: { marginTop: spacing.lg },
  timingText: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurface,
  },
  actions: {
    flexDirection: 'row', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
    backgroundColor: 'rgba(23,18,25,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  expiredBar: {
    flex: 1, paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full, alignItems: 'center',
  },
  expiredText: {
    fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodySm, color: colors.outline,
  },
  declineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radii.full, borderWidth: 1, borderColor: `${colors.error}40`,
  },
  declineBtnText: {
    fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodySm, color: colors.error,
  },
  acceptBtn: { flex: 1 },
  // Decline sheet
  sheetOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl,
    paddingTop: spacing.xxl, paddingHorizontal: spacing.xl,
    borderTopWidth: 1, borderColor: colors.glassBorder,
  },
  sheetTitle: {
    fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  sheetSub: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant, marginBottom: spacing.xl,
  },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.glassBorder,
  },
  reasonLabel: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyLg, color: colors.onSurface,
  },
  cancelBtn: {
    marginTop: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radii.full, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant,
  },
});

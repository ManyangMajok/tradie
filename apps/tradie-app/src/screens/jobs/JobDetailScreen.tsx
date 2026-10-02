import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Linking, RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, MessageSquare, CheckCircle, Truck, Wrench, Map } from 'lucide-react-native';
import { TopBar, GlassCard, Badge, Button, colors, typography, spacing, radii, gradients } from '@tradify/ui';
import { client, type Job, JOB_STATUS_LABELS } from '@tradify/shared';
import { LinearGradient } from 'expo-linear-gradient';
import type { RootStackParamList } from '../../navigation/RootNavigator';

// Stitch ref: docs/stitch/job_detail/

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

const TIMELINE_STEPS = [
  { status: 'assigned', label: 'Assigned', icon: CheckCircle },
  { status: 'tradie_on_the_way', label: 'On the Way', icon: Truck },
  { status: 'in_progress', label: 'In Progress', icon: Wrench },
  { status: 'completed', label: 'Completed', icon: CheckCircle },
];

const STATUS_ORDER = ['assigned', 'tradie_on_the_way', 'in_progress', 'completed', 'confirmed'];

function statusIndex(s: string) { return STATUS_ORDER.indexOf(s); }

function nextTransition(status: string): { label: string; toStatus: string } | null {
  const map: Record<string, { label: string; toStatus: string }> = {
    assigned: { label: "I'm on the way", toStatus: 'tradie_on_the_way' },
    tradie_on_the_way: { label: "I've started", toStatus: 'in_progress' },
  };
  return map[status] ?? null;
}

export function JobDetailScreen({ navigation, route }: Props) {
  const { publicId } = route.params;
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: job, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['job', publicId],
    queryFn: () => client.get<{ data: Job }>(`/api/v1/tradie/jobs/${publicId}`).then((r) => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: (toStatus: string) =>
      client.post(`/api/v1/tradie/jobs/${publicId}/status`, { to_status: toStatus }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job', publicId] });
      qc.invalidateQueries({ queryKey: ['tradie-jobs'] });
    },
  });

  if (isLoading || !job) {
    return (
      <View style={styles.container}>
        <TopBar title="Job" leftAction="back" onBack={() => navigation.goBack()} />
      </View>
    );
  }

  const transition = nextTransition(job.status);
  const isCompletable = job.status === 'in_progress';
  const currentStepIdx = statusIndex(job.status);
  const memberName = job.member_first_name
    ? `${job.member_first_name} ${job.member_last_name ?? ''}`.trim()
    : 'Member';

  return (
    <View style={styles.container}>
      <TopBar
        title={`Job #${publicId.slice(0, 8).toUpperCase()}`}
        subtitle={JOB_STATUS_LABELS[job.status] ?? job.status}
        leftAction="back"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Member contact card */}
        <GlassCard style={styles.contactCard}>
          <Text style={styles.sectionLabel}>MEMBER</Text>
          <View style={styles.contactRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {job.member_first_name?.[0]?.toUpperCase() ?? 'M'}
              </Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{memberName}</Text>
              {job.member_phone && (
                <Text style={styles.phoneNumber} selectable>{job.member_phone}</Text>
              )}
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity
                style={[styles.contactBtn, !job.member_phone && styles.contactBtnDisabled]}
                onPress={() => job.member_phone && Linking.openURL(`tel:${job.member_phone}`)}
                disabled={!job.member_phone}
                accessibilityLabel="Call member"
              >
                <Phone size={16} color={job.member_phone ? colors.primaryLight : colors.outline} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactBtn, !job.member_phone && styles.contactBtnDisabled]}
                onPress={() => job.member_phone && Linking.openURL(`sms:${job.member_phone}`)}
                disabled={!job.member_phone}
                accessibilityLabel="SMS member"
              >
                <MessageSquare size={16} color={job.member_phone ? colors.onSurfaceVariant : colors.outline} />
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>

        {/* Address */}
        <GlassCard style={styles.addressCard}>
          <View style={styles.addressRow}>
            <MapPin size={16} color={colors.primary} />
            <View style={styles.addressText}>
              <Text style={styles.addressLine}>{job.address_line_1}</Text>
              <Text style={styles.addressSub}>{job.suburb} {job.postcode}, {job.state}</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(`http://maps.google.com/?q=${encodeURIComponent(`${job.address_line_1} ${job.suburb} ${job.state}`)}`)
              }
              accessibilityLabel="Open in maps"
            >
              <Map size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Job summary */}
        <GlassCard style={styles.summaryCard}>
          <View style={styles.badgeRow}>
            <Badge label={job.category} variant="primary" />
            {job.issue_type ? <Badge label={job.issue_type} variant="active" /> : null}
          </View>
          <Text style={styles.description}>{job.description}</Text>

          {job.photo_urls.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photos}>
              {job.photo_urls.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.photo} />
              ))}
            </ScrollView>
          )}
        </GlassCard>

        {/* Status timeline */}
        <GlassCard style={styles.timelineCard}>
          <Text style={styles.sectionLabel}>PROGRESS</Text>
          {TIMELINE_STEPS.map((step, i) => {
            const done = statusIndex(step.status) <= currentStepIdx;
            const Icon = step.icon;
            return (
              <View key={step.status} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, done && styles.timelineDotActive]}>
                    <Icon size={12} color={done ? colors.background : colors.outline} strokeWidth={2.5} />
                  </View>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <View style={[styles.timelineLine, done && styles.timelineLineActive]} />
                  )}
                </View>
                <Text style={[styles.timelineLabel, done && styles.timelineLabelActive]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </GlassCard>
      </ScrollView>

      {/* Bottom actions */}
      {(transition || isCompletable) && (
        <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.md }]}>
          {transition && (
            <Button
              label={transition.label}
              onPress={() => updateStatus.mutate(transition.toStatus)}
              loading={updateStatus.isPending}
            />
          )}
          {isCompletable && (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => navigation.navigate('CompletionForm', { publicId })}
              accessibilityLabel="Mark job complete"
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.completeBtnGrad}
              >
                <CheckCircle size={16} color={colors.background} />
                <Text style={styles.completeBtnText}>Mark Complete</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md },
  sectionLabel: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.labelCaps,
    color: colors.onSurfaceVariant,
    letterSpacing: typography.letterSpacings.labelCaps,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  contactCard: {},
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${colors.primary}25`,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontFamily: typography.fonts.bold, fontSize: 18, color: colors.primaryLight },
  contactInfo: { flex: 1 },
  contactName: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyLg, color: colors.onSurface },
  phoneNumber: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant, marginTop: 2,
  },
  contactActions: { flexDirection: 'row', gap: spacing.sm },
  contactBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: `${colors.primary}30`,
  },
  contactBtnDisabled: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.glassBorder,
  },
  addressCard: {},
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  addressText: { flex: 1 },
  addressLine: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodySm, color: colors.onSurface },
  addressSub: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant },
  summaryCard: { gap: spacing.sm },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  description: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
    lineHeight: typography.lineHeights.bodyLg,
  },
  photos: { marginTop: spacing.sm },
  photo: {
    width: 120, height: 120, borderRadius: radii.lg,
    marginRight: spacing.md, backgroundColor: colors.surfaceContainer,
  },
  timelineCard: {},
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, minHeight: 36 },
  timelineLeft: { alignItems: 'center', width: 24 },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.outline,
  },
  timelineDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineLine: { width: 2, flex: 1, minHeight: 12, backgroundColor: colors.surfaceContainer, marginVertical: 2 },
  timelineLineActive: { backgroundColor: `${colors.primary}60` },
  timelineLabel: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm,
    color: colors.outline, paddingTop: 4,
  },
  timelineLabelActive: { color: colors.onSurface, fontFamily: typography.fonts.semiBold },
  actions: {
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
    backgroundColor: 'rgba(23,18,25,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    gap: spacing.sm,
  },
  completeBtn: {
    borderRadius: radii.full, overflow: 'hidden', height: 52,
  },
  completeBtnGrad: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.sm,
  },
  completeBtnText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.bodyLg,
    color: colors.background,
  },
});

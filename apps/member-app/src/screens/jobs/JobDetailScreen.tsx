import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Clock, Info, ShieldAlert } from 'lucide-react-native';
import { GlassCard, Button, colors, typography, spacing, radii } from '@tradify/ui';
import { memberApi } from '@tradify/shared';

export function JobDetailScreen({ route, navigation }: any) {
  const { publicId } = route.params;
  const insets = useSafeAreaInsets();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadJob() {
    try {
      const res = await memberApi.getJob(publicId);
      setJob(res);
    } catch (err) {
      Alert.alert('Error', 'Failed to load job details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadJob);
    return unsubscribe;
  }, [navigation, publicId]);

  const handleCancel = () => {
    Alert.alert('Cancel Job', 'Are you sure you want to cancel this job request?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
          try {
            await memberApi.cancelJob(publicId);
            navigation.goBack();
          } catch (e) { Alert.alert('Error', 'Could not cancel job.'); }
        }
      }
    ]);
  };

  if (loading || !job) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <GlassCard style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.jobStatus}>{job.status}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={16} color={colors.outline} />
            <Text style={styles.infoText}>{job.property?.address}, {job.property?.city}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={16} color={colors.outline} />
            <Text style={styles.infoText}>Created {new Date(job.created_at).toLocaleDateString()}</Text>
          </View>

          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </GlassCard>

        {job.tradie && (
          <GlassCard style={styles.card}>
            <Text style={styles.sectionTitle}>Assigned Tradie</Text>
            <View style={styles.tradieRow}>
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{job.tradie.company_name?.[0] || 'T'}</Text>
              </View>
              <View style={styles.tradieInfo}>
                <Text style={styles.tradieName}>{job.tradie.company_name}</Text>
                <Text style={styles.tradieContact}>{job.tradie.phone}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {(job.status === 'open' || job.status === 'assigned') && (
          <Button label="Cancel Request" onPress={handleCancel} variant="outline" style={styles.cancelBtn} />
        )}

        {job.status === 'completed' && !job.reviewed && (
          <Button label="Leave a Review" onPress={() => navigation.navigate('ReviewForm', { publicId: job.public_id })} style={styles.reviewBtn} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  content: { padding: spacing.xl, gap: spacing.md },
  card: { gap: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  jobTitle: { flex: 1, fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  statusBadge: { backgroundColor: `${colors.primary}15`, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  jobStatus: { fontFamily: typography.fonts.semiBold, fontSize: 10, color: colors.primaryLight, textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyMd, color: colors.onSurfaceVariant },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: spacing.xs },
  sectionTitle: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyLg, color: colors.onSurface },
  description: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyMd, color: colors.onSurfaceVariant, lineHeight: 22 },
  tradieRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: typography.fonts.bold, fontSize: 20, color: colors.primaryLight },
  tradieInfo: { flex: 1 },
  tradieName: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyLg, color: colors.onSurface },
  tradieContact: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant },
  cancelBtn: { borderColor: colors.error },
  reviewBtn: { marginTop: spacing.md },
});

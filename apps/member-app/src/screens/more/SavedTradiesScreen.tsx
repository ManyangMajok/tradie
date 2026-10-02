import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, Star, ChevronLeft } from 'lucide-react-native';
import { GlassCard, Button, colors, typography, spacing } from '@tradify/ui';
import { memberApi } from '@tradify/shared';

export function SavedTradiesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [tradies, setTradies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadTradies() {
    try {
      const res = await memberApi.getSavedTradies();
      setTradies(res);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTradies();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTradies();
  };

  const handleRemove = async (id: number) => {
    try {
      await memberApi.removeSavedTradie(id);
      setTradies((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      Alert.alert('Error', 'Failed to remove saved tradie.');
    }
  };

  const renderTradie = ({ item }: { item: any }) => (
    <GlassCard style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>{item.company_name?.[0] || 'T'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.companyName}>{item.company_name}</Text>
          <View style={styles.ratingRow}>
            <Star size={14} color={colors.warning} fill={colors.warning} />
            <Text style={styles.ratingText}>{item.rating} ({item.reviews_count} reviews)</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id)}>
          <Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
      <Button label="Find a Fundi" onPress={() => navigation.navigate('SubmitRequest')} variant="secondary" style={styles.actionBtn} />
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Tradies</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={tradies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTradie}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No saved tradies</Text>
              <Text style={styles.emptyDesc}>When you save tradies you like, they will appear here.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  listContent: { padding: spacing.xl, gap: spacing.md },
  card: { gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarFallback: { width: 50, height: 50, borderRadius: 25, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: typography.fonts.bold, fontSize: 20, color: colors.primaryLight },
  info: { flex: 1 },
  companyName: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyLg, color: colors.onSurface },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant },
  removeBtn: { padding: spacing.sm },
  actionBtn: { marginTop: spacing.xs },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: spacing.md },
  emptyTitle: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  emptyDesc: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: spacing.xl },
});

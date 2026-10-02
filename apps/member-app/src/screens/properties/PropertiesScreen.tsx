import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Home as HomeIcon, MapPin } from 'lucide-react-native';
import { GlassCard, colors, typography, spacing } from '@tradify/ui';
import { memberApi } from '@tradify/shared';

export function PropertiesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadProperties() {
    try {
      const res = await memberApi.getProperties();
      setProperties(res);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProperties();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProperties();
  };

  const renderProperty = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PropertyForm', { propertyId: item.id })}>
      <GlassCard style={styles.propCard}>
        <View style={styles.propIcon}>
          <HomeIcon size={24} color={colors.primaryLight} />
        </View>
        <View style={styles.propInfo}>
          <Text style={styles.propType}>{item.type}</Text>
          <View style={styles.addressRow}>
            <MapPin size={14} color={colors.outline} />
            <Text style={styles.propAddress} numberOfLines={1}>{item.address}</Text>
          </View>
          <Text style={styles.propCity}>{item.city}, {item.state} {item.postcode}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>My Properties</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('PropertyForm')}>
          <Plus size={20} color={colors.primaryLight} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={properties}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProperty}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No properties</Text>
              <Text style={styles.emptyDesc}>Add a property to start requesting jobs for it.</Text>
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
  propCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  propIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${colors.primary}10`, alignItems: 'center', justifyContent: 'center' },
  propInfo: { flex: 1 },
  propType: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyMd, color: colors.onSurface, textTransform: 'capitalize' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  propAddress: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant, flex: 1 },
  propCity: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyXs, color: colors.outline, marginTop: 2, marginLeft: 18 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: spacing.md },
  emptyTitle: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  emptyDesc: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: spacing.xl },
});

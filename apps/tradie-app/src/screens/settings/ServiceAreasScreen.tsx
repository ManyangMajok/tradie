import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, MapPin, Search } from 'lucide-react-native';
import { TopBar, GlassCard, colors, typography, spacing, radii } from '@tradify/ui';
import { client, type ServiceArea } from '@tradify/shared';
import type { RootStackParamList } from '../../navigation/RootNavigator';

// Stitch ref: docs/stitch/service_areas/ — spec §9.10

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceAreas'>;

interface SuburbResult {
  id: number;
  name: string;
  postcode: string;
  state: string;
}

export function ServiceAreasScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { data: areas = [] } = useQuery<ServiceArea[]>({
    queryKey: ['service-areas'],
    queryFn: () => client.get<{ data: ServiceArea[] }>('/api/v1/tradie/service-areas').then((r) => r.data.data),
  });

  const { data: results = [] } = useQuery<SuburbResult[]>({
    queryKey: ['suburb-search', query],
    queryFn: () =>
      client.get<{ data: SuburbResult[] }>('/api/v1/tradie/suburbs/search', { params: { q: query } }).then((r) => r.data.data),
    enabled: query.trim().length >= 2,
  });

  const addArea = useMutation({
    mutationFn: (suburb_id: number) =>
      client.post('/api/v1/tradie/service-areas', { suburb_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-areas'] });
      setQuery('');
      setSearchOpen(false);
    },
  });

  const removeArea = useMutation({
    mutationFn: (id: number) =>
      client.delete(`/api/v1/tradie/service-areas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-areas'] }),
  });

  function handleRemove(area: ServiceArea) {
    if (areas.length <= 1) {
      Alert.alert(
        'Cannot remove',
        'You need at least one service area to receive leads.',
      );
      return;
    }
    removeArea.mutate(area.id);
  }

  const activeIds = new Set(areas.map((a) => a.suburb_id));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <TopBar
        title="Service Areas"
        subtitle={`${areas.length} suburb${areas.length !== 1 ? 's' : ''}`}
        leftAction="back"
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={areas}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity style={styles.addBtn} onPress={() => setSearchOpen(true)}>
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addBtnText}>Add suburb</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MapPin size={32} color={colors.outline} strokeWidth={1.2} />
            <Text style={styles.emptyText}>No service areas yet</Text>
            <Text style={styles.emptyHint}>Add a suburb to start receiving leads.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.row}>
            <View style={styles.rowIcon}>
              <MapPin size={14} color={colors.secondary} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.suburbName}>{item.suburb_name}</Text>
              <Text style={styles.suburbMeta}>{item.postcode} · {item.state}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(item)}
              accessibilityLabel={`Remove ${item.suburb_name}`}
            >
              <X size={14} color={colors.error} />
            </TouchableOpacity>
          </GlassCard>
        )}
      />

      <Modal
        visible={searchOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSearchOpen(false)}
      >
        <View style={[styles.modal, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Suburb</Text>
            <TouchableOpacity onPress={() => { setSearchOpen(false); setQuery(''); }}>
              <X size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Search size={16} color={colors.outline} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search suburb or postcode…"
              placeholderTextColor={colors.outline}
              autoFocus
              returnKeyType="search"
            />
          </View>

          <FlatList
            data={results}
            keyExtractor={(r) => String(r.id)}
            contentContainerStyle={styles.results}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const already = activeIds.has(item.id);
              return (
                <TouchableOpacity
                  style={[styles.resultRow, already && styles.resultRowDisabled]}
                  onPress={() => !already && addArea.mutate(item.id)}
                  disabled={already}
                >
                  <Text style={[styles.resultName, already && styles.resultNameDisabled]}>
                    {item.name}
                  </Text>
                  <Text style={styles.resultMeta}>{item.postcode} · {item.state}</Text>
                  {already && <Text style={styles.alreadyAdded}>Added</Text>}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              query.length >= 2 ? (
                <Text style={styles.noResults}>No suburbs found for "{query}"</Text>
              ) : (
                <Text style={styles.noResults}>Type 2+ characters to search</Text>
              )
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.xl, gap: spacing.sm },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1.5, borderColor: `${colors.primary}40`,
    borderStyle: 'dashed', borderRadius: radii.xl,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    justifyContent: 'center', marginBottom: spacing.md,
  },
  addBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodyLg,
    color: colors.primary,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIcon: {
    width: 32, height: 32, borderRadius: radii.md,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  suburbName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
  },
  suburbMeta: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  removeBtn: {
    width: 32, height: 32, borderRadius: radii.md,
    backgroundColor: `${colors.error}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
  },
  emptyHint: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  modal: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.onSurface,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
  },
  results: { gap: spacing.xs },
  resultRow: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderBottomWidth: 1, borderBottomColor: colors.glassBorder,
  },
  resultRowDisabled: { opacity: 0.5 },
  resultName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
  },
  resultNameDisabled: { color: colors.outline },
  resultMeta: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  alreadyAdded: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodySm,
    color: colors.outline,
    marginTop: 2,
  },
  noResults: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingTop: spacing.section,
  },
});

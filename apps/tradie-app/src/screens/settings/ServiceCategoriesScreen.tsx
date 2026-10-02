import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Circle } from 'lucide-react-native';
import { TopBar, GlassCard, colors, typography, spacing } from '@tradify/ui';
import { client } from '@tradify/shared';
import type { RootStackParamList } from '../../navigation/RootNavigator';

// Stitch ref: docs/stitch/service_categories/ — spec §9.11

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceCategories'>;

interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export function ServiceCategoriesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery<CategoryRow[]>({
    queryKey: ['tradie-categories'],
    queryFn: () => client.get<{ data: CategoryRow[] }>('/api/v1/tradie/categories').then((r) => r.data.data),
  });

  const toggle = useMutation({
    mutationFn: ({ category_id, active }: { category_id: number; active: boolean }) =>
      client.post('/api/v1/tradie/categories', { category_id, active: active }),
    onMutate: async ({ category_id, active }) => {
      await qc.cancelQueries({ queryKey: ['tradie-categories'] });
      const prev = qc.getQueryData<CategoryRow[]>(['tradie-categories']) ?? [];
      qc.setQueryData<CategoryRow[]>(['tradie-categories'], (rows = []) =>
        rows.map((r) => (r.id === category_id ? { ...r, is_active: active } : r)),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tradie-categories'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tradie-categories'] }),
  });

  function handleToggle(cat: CategoryRow) {
    const activeCount = categories.filter((c) => c.is_active).length;
    if (cat.is_active && activeCount <= 1) {
      Alert.alert(
        'Cannot disable',
        'You need at least one category enabled to receive leads.',
      );
      return;
    }
    toggle.mutate({ category_id: cat.id, active: !cat.is_active });
  }

  const activeCount = categories.filter((c) => c.is_active).length;

  return (
    <View style={styles.container}>
      <TopBar
        title="Categories"
        subtitle={`${activeCount} active`}
        leftAction="back"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>
          You can only accept leads in categories you've enabled.
        </Text>

        <GlassCard padding={0}>
          {categories.map((cat, i) => (
            <View key={cat.id}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => handleToggle(cat)}
                activeOpacity={0.7}
                accessibilityLabel={`${cat.name}, ${cat.is_active ? 'enabled' : 'disabled'}`}
                accessibilityRole="switch"
                accessibilityState={{ checked: cat.is_active }}
              >
                <View style={[styles.statusDot, cat.is_active && styles.statusDotActive]} />
                <Text style={styles.catName}>{cat.name}</Text>
                {cat.is_active ? (
                  <CheckCircle size={20} color={colors.primary} />
                ) : (
                  <Circle size={20} color={colors.outline} />
                )}
              </TouchableOpacity>
              {i < categories.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </GlassCard>

        <Text style={styles.note}>
          Changes take effect immediately. Any leads already dispatched are unaffected.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  hint: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.outline,
  },
  statusDotActive: { backgroundColor: colors.primary },
  catName: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
  },
  divider: {
    height: 1, backgroundColor: colors.glassBorder, marginLeft: spacing.lg,
  },
  note: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.outline,
    textAlign: 'center',
    lineHeight: 18,
  },
});

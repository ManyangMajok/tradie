import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@tradify/ui';
import type { AvailableTradie } from '@tradify/shared';
export function TradieChoices({ tradies, selected, onSelect, disabled = false }: { tradies: AvailableTradie[]; selected: number | null; onSelect: (id: number) => void; disabled?: boolean }) {
  return <View style={styles.list}>
    {tradies.length === 0 && <Text style={styles.text}>No fundis are available for this area and trade right now. Refresh later or choose another property.</Text>}
    {tradies.map((t, i) => <TouchableOpacity key={t.id} accessibilityRole="radio" accessibilityState={{ checked: selected === t.id, disabled }} accessibilityLabel={`${t.business_name}, ${t.rating_average ?? 'not yet rated'}, ${t.rating_count} reviews`} disabled={disabled} onPress={() => onSelect(t.id)} style={[styles.card, selected === t.id && styles.selected]}>
      <Text style={styles.name}>{i + 1}. {t.business_name}</Text>
      <Text style={styles.text}>{t.rating_average === null ? 'Not yet rated' : `${Number(t.rating_average).toFixed(1)} / 5`} · {t.rating_count} reviews</Text>
      {t.about_text ? <Text style={styles.text}>{t.about_text}</Text> : null}
    </TouchableOpacity>)}
  </View>;
}
const styles = StyleSheet.create({ list: { gap: spacing.md }, card: { padding: spacing.lg, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12, gap: spacing.sm }, selected: { borderColor: colors.primaryLight, backgroundColor: colors.glassBackground }, name: { color: colors.onSurface, fontFamily: typography.fonts.bold, fontSize: 16 }, text: { color: colors.onSurfaceVariant, fontSize: 14 } });

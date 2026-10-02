import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, GlassCard, colors, spacing, typography } from '@tradify/ui';
import { apiError, memberApi, type AvailableTradie } from '@tradify/shared';
import { TradieChoices } from '../../components/TradieChoices';

export function SubmitRequestScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [reference, setReference] = useState<any>(null);
  const [property, setProperty] = useState<number | null>(null);
  const [category, setCategory] = useState<number | null>(null);
  const [urgency, setUrgency] = useState('flexible');
  const [issue, setIssue] = useState('');
  const [description, setDescription] = useState('');
  const [choices, setChoices] = useState<AvailableTradie[] | null>(null);
  const [location, setLocation] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function load() {
    setError('');
    try { const data = await memberApi.getRequestData(); setReference(data); if (data.properties.length === 1) setProperty(data.properties[0].id); }
    catch (e) { setError(apiError(e)); }
  }
  useEffect(() => { void load(); }, []);
  async function find() {
    if (!property || !category || !issue.trim() || description.trim().length < 10) { setError('Choose a property and trade, describe the issue, and add at least 10 characters of detail.'); return; }
    setBusy(true); setError('');
    try { const data = await memberApi.getAvailableTradies({ property_id: property, tradie_category_id: category, urgency }); setChoices(data.tradies); setLocation(data.location); setSelected(null); }
    catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  }
  async function submit() {
    if (!property || !category || !selected || busy) return;
    setBusy(true); setError('');
    try {
      const result = await memberApi.submitJob({ property_id: property, tradie_category_id: category, urgency, custom_issue: issue.trim(), description: description.trim(), selected_tradie_company_id: selected });
      navigation.replace('JobDetail', { publicId: result.public_id });
    } catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  }
  function option(id: number | string, label: string, checked: boolean, select: () => void) {
    return <TouchableOpacity key={id} accessibilityRole="radio" accessibilityState={{ checked }} accessibilityLabel={label} disabled={busy} onPress={select} style={[styles.option, checked && styles.selected]}><Text style={styles.text}>{label}</Text></TouchableOpacity>;
  }
  return <ScrollView keyboardShouldPersistTaps="handled" style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}>
    <Text style={styles.heading}>Request a local fundi</Text>
    <Button label="Close" variant="ghost" disabled={busy} onPress={() => navigation.goBack()} />
    {!reference ? <><ActivityIndicator color={colors.primaryLight} /><Button label="Retry loading" onPress={load} /></> : choices === null ? <GlassCard style={styles.form}>
      <Text style={styles.label}>Property</Text>
      {reference.properties.map((p: any) => option(p.id, `${p.label}: ${p.address_line_1}, ${p.suburb?.name}`, property === p.id, () => setProperty(p.id)))}
      {reference.properties.length === 0 && <Button label="Add a property" onPress={() => navigation.replace('PropertyForm', {})} />}
      <Text style={styles.label}>Trade</Text>
      {reference.categories.map((c: any) => option(c.id, c.name, category === c.id, () => setCategory(c.id)))}
      <Text style={styles.label}>Urgency</Text>
      {[['flexible', 'Flexible'], ['within_48h', 'Within 48 hours'], ['same_day', 'Same day'], ['emergency', 'Emergency']].map(([id, label]) => option(id, label, urgency === id, () => setUrgency(id)))}
      <Text style={styles.label}>Issue</Text><TextInput accessibilityLabel="Issue" style={styles.input} value={issue} onChangeText={setIssue} maxLength={200} placeholder="Leaking kitchen tap" placeholderTextColor={colors.outline} />
      <Text style={styles.label}>Description</Text><TextInput accessibilityLabel="Description" style={[styles.input, { minHeight: 100 }]} multiline value={description} onChangeText={setDescription} maxLength={2000} placeholder="Describe the problem" placeholderTextColor={colors.outline} />
      <Button label="Find local fundis" onPress={find} loading={busy} />
    </GlassCard> : <GlassCard style={styles.form}>
      <Text style={styles.label}>Available in {location} · highest rated first</Text>
      <Text style={styles.text}>Only your chosen fundi receives this request. They must accept before the job is assigned.</Text>
      <TradieChoices tradies={choices} selected={selected} onSelect={setSelected} disabled={busy} />
      <Button label="Send to chosen fundi" disabled={!selected} loading={busy} onPress={submit} />
      <Button label="Refresh availability" variant="secondary" disabled={busy} onPress={find} />
      <Button label="Edit request" variant="ghost" disabled={busy} onPress={() => { setChoices(null); setSelected(null); }} />
    </GlassCard>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.xl, gap: spacing.md }, heading: { color: colors.onSurface, fontFamily: typography.fonts.bold, fontSize: 24 }, form: { gap: spacing.md }, label: { color: colors.onSurface, fontFamily: typography.fonts.bold, fontSize: 16 }, text: { color: colors.onSurfaceVariant, fontSize: 16 }, option: { padding: spacing.md, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12 }, selected: { borderColor: colors.primaryLight }, input: { color: colors.onSurface, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12, padding: spacing.md, fontSize: 16 }, error: { color: colors.error, fontSize: 16 } });

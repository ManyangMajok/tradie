import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { memberApi, apiError } from '@tradify/shared';
import { colors, spacing, Button } from '@tradify/ui';
export function PropertyFormScreen({ route, navigation }: any) {
  const id = route.params?.propertyId;
  const insets = useSafeAreaInsets();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ label: '', address_line_1: '', suburb_id: 0, property_type: 'house' });
  async function load() {
    setLoading(true);
    try {
      setLocations(await memberApi.getLocations());
      if (id) { const p = await memberApi.getProperty(id); setForm({ label: p.label, address_line_1: p.address_line_1, suburb_id: p.suburb_id, property_type: p.property_type }); }
    } catch (e) { Alert.alert('Unable to load', apiError(e)); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [id]);
  async function save() {
    if (!form.label.trim() || !form.address_line_1.trim() || !form.suburb_id) { Alert.alert('Required', 'Enter a label, address and service area.'); return; }
    setBusy(true);
    try { if (id) await memberApi.updateProperty(id, form); else await memberApi.addProperty(form); navigation.goBack(); }
    catch (e) { Alert.alert('Unable to save', apiError(e)); } finally { setBusy(false); }
  }
  return <ScrollView keyboardShouldPersistTaps="handled" style={styles.screen} contentContainerStyle={{ padding: spacing.xl, paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
    <Text style={styles.title}>{id ? 'Edit property' : 'Add property'}</Text>
    <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
    <Text style={styles.text}>Property label</Text><TextInput accessibilityLabel="Property label" style={styles.input} maxLength={255} value={form.label} onChangeText={label => setForm({ ...form, label })} />
    <Text style={styles.text}>Street or estate address</Text><TextInput accessibilityLabel="Street or estate address" style={styles.input} maxLength={255} value={form.address_line_1} onChangeText={address_line_1 => setForm({ ...form, address_line_1 })} />
    <Text style={styles.text}>Kenyan service area</Text>
    {locations.map(p => <TouchableOpacity key={p.id} accessibilityRole="radio" accessibilityState={{ checked: form.suburb_id === p.id }} accessibilityLabel={`${p.name}, ${p.state}`} style={[styles.option, form.suburb_id === p.id && styles.selected]} onPress={() => setForm({ ...form, suburb_id: p.id })}><Text style={styles.text}>{p.name}, {p.state}</Text></TouchableOpacity>)}
    <Text style={styles.text}>Property type</Text>
    {['house', 'apartment', 'townhouse', 'duplex', 'commercial', 'other'].map(type => <TouchableOpacity key={type} accessibilityRole="radio" accessibilityState={{ checked: form.property_type === type }} accessibilityLabel={type} style={[styles.option, form.property_type === type && styles.selected]} onPress={() => setForm({ ...form, property_type: type })}><Text style={styles.text}>{type}</Text></TouchableOpacity>)}
    {!locations.length && <Button label="Retry locations" onPress={load} loading={loading} />}
    <Button label="Save property" onPress={save} loading={busy} disabled={loading} />
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, title: { color: colors.onSurface, fontSize: 24 }, text: { color: colors.onSurface, fontSize: 16 }, input: { color: colors.onSurface, fontSize: 16, padding: 12, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12 }, option: { padding: 12, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12 }, selected: { borderColor: colors.primaryLight } });

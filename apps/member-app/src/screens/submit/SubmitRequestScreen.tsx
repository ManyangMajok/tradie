import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronDown } from 'lucide-react-native';
import { GlassCard, Button, colors, typography, spacing } from '@tradify/ui';
import { memberApi } from '@tradify/shared';

export function SubmitRequestScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [properties, setProperties] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [propsRes, catsRes] = await Promise.all([
          memberApi.getProperties(),
          // Placeholder: ideally an endpoint for categories
          fetch('http://127.0.0.1:8085/api/v1/tradie/categories').then(r=>r.json()).catch(()=>[]) // hacky fallback, ideally use shared api
        ]);
        setProperties(propsRes);
        // Categories can be hardcoded for member app demo if API isn't exposed
        setCategories([
          { id: 1, name: 'Plumbing' },
          { id: 2, name: 'Electrical' },
          { id: 3, name: 'Carpentry' },
        ]);
        if (propsRes.length > 0) setPropertyId(propsRes[0].id);
        setCategoryId(1);
      } catch (err) {
        console.warn(err);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async () => {
    if (!propertyId || !categoryId || !title.trim() || !description.trim()) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await memberApi.submitJob({
        property_id: propertyId,
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
      });
      Alert.alert('Success', 'Your job request has been matched and sent to tradies!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Could not submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>New Request</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <X size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <GlassCard style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>PROPERTY</Text>
            <View style={styles.pickerFake}>
              <Text style={styles.pickerText}>
                {properties.find(p => p.id === propertyId)?.address || 'Select a property...'}
              </Text>
              <ChevronDown size={20} color={colors.outline} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>CATEGORY</Text>
            <View style={styles.pickerFake}>
              <Text style={styles.pickerText}>
                {categories.find(c => c.id === categoryId)?.name || 'Select a category...'}
              </Text>
              <ChevronDown size={20} color={colors.outline} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>JOB TITLE</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Leaking kitchen sink"
              placeholderTextColor={colors.outline}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Please describe the issue in detail..."
              placeholderTextColor={colors.outline}
              multiline
              textAlignVertical="top"
            />
          </View>

          <Button label="Find a Tradie" onPress={handleSubmit} loading={loading} style={styles.submitBtn} />
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  headerTitle: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  closeBtn: { position: 'absolute', right: spacing.md, bottom: spacing.sm, padding: spacing.sm },
  content: { padding: spacing.xl },
  card: { gap: spacing.lg },
  field: { gap: spacing.xs },
  label: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.labelCaps, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  input: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyMd, color: colors.onSurface, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12, paddingHorizontal: spacing.md, height: 48, backgroundColor: `${colors.surface}50` },
  textArea: { height: 120, paddingVertical: spacing.md },
  pickerFake: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12, paddingHorizontal: spacing.md, height: 48, backgroundColor: `${colors.surface}50` },
  pickerText: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyMd, color: colors.onSurface },
  submitBtn: { marginTop: spacing.md },
});

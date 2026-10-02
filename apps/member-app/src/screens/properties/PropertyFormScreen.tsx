import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { GlassCard, Button, colors, typography, spacing } from '@tradify/ui';
import { memberApi } from '@tradify/shared';

export function PropertyFormScreen({ route, navigation }: any) {
  const { propertyId } = route.params || {};
  const isEditing = !!propertyId;
  const insets = useSafeAreaInsets();
  
  const [type, setType] = useState('house');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      // In a real app, you'd fetch the specific property details here or pass them in route params
      // memberApi.getProperty(propertyId).then(p => ...)
    }
  }, [isEditing, propertyId]);

  const handleSubmit = async () => {
    if (!address.trim() || !city.trim() || !state.trim() || !postcode.trim()) {
      Alert.alert('Required', 'Please fill in all address fields.');
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await memberApi.updateProperty(propertyId, { type, address, city, state, postcode });
        Alert.alert('Success', 'Property updated successfully.');
      } else {
        await memberApi.addProperty({ type, address, city, state, postcode });
        Alert.alert('Success', 'Property added successfully.');
      }
      navigation.goBack();
    } catch (err: any) {
      if (err?.response?.status === 402) {
         Alert.alert('Limit Reached', 'You have reached the maximum number of properties for your membership plan.');
      } else {
         Alert.alert('Error', 'Could not save property.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Property' : 'Add Property'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <GlassCard style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>PROPERTY TYPE</Text>
            <View style={styles.typeRow}>
              {['house', 'apartment', 'townhouse'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeText, type === t && styles.typeTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>STREET ADDRESS</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 123 Main St"
              placeholderTextColor={colors.outline}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={styles.label}>CITY/SUBURB</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Sydney"
                placeholderTextColor={colors.outline}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>STATE</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="NSW"
                placeholderTextColor={colors.outline}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>POSTCODE</Text>
            <TextInput
              style={styles.input}
              value={postcode}
              onChangeText={setPostcode}
              placeholder="2000"
              placeholderTextColor={colors.outline}
              keyboardType="number-pad"
            />
          </View>

          <Button label={isEditing ? 'Save Changes' : 'Add Property'} onPress={handleSubmit} loading={loading} style={styles.submitBtn} />
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  content: { padding: spacing.xl },
  card: { gap: spacing.lg },
  field: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
  label: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.labelCaps, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  input: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyMd, color: colors.onSurface, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12, paddingHorizontal: spacing.md, height: 48, backgroundColor: `${colors.surface}50` },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeBtn: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.surface}30` },
  typeBtnActive: { backgroundColor: `${colors.primary}20`, borderColor: colors.primaryLight },
  typeText: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant },
  typeTextActive: { color: colors.primaryLight },
  submitBtn: { marginTop: spacing.sm },
});

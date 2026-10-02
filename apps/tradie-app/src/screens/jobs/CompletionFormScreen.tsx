import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Image, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { X, Plus, CheckCircle } from 'lucide-react-native';
import { TopBar, GlassCard, Button, colors, typography, spacing, radii } from '@tradify/ui';
import { client } from '@tradify/shared';
import type { RootStackParamList } from '../../navigation/RootNavigator';

// Stitch ref: docs/stitch/completion_form_step_1/ through completion_form_step_5/

type Props = NativeStackScreenProps<RootStackParamList, 'CompletionForm'>;

const TOTAL_STEPS = 5;

interface FormData {
  summary: string;
  invoice_amount: string;
  callout_fee_waived: boolean;
  discount_applied: boolean;
  discount_amount: string;
  photos: string[];
}

export function CompletionFormScreen({ navigation, route }: Props) {
  const { publicId } = route.params;
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    summary: '',
    invoice_amount: '',
    callout_fee_waived: true,
    discount_applied: false,
    discount_amount: '',
    photos: [],
  });

  const submit = useMutation({
    mutationFn: () =>
      client.post(`/api/v1/tradie/jobs/${publicId}/complete`, {
        summary_of_work:          form.summary,
        invoice_total_cents:      Math.round(parseFloat(form.invoice_amount || '0') * 100),
        no_callout_fee_confirmed: form.callout_fee_waived,
        discount_applied:         form.discount_applied,
        discount_amount_cents:    form.discount_applied
          ? Math.round(parseFloat(form.discount_amount || '0') * 100)
          : 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job', publicId] });
      qc.invalidateQueries({ queryKey: ['tradie-jobs'] });
      navigation.pop(2);
    },
  });

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setForm((f) => ({ ...f, photos: [...f.photos, result.assets[0].uri] }));
    }
  }

  function removePhoto(i: number) {
    setForm((f) => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }));
  }

  function canAdvance(): boolean {
    if (step === 1) return form.summary.trim().length >= 10;
    if (step === 2) return !!form.invoice_amount && parseFloat(form.invoice_amount) > 0;
    return true;
  }

  function handleNext() {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else {
      Alert.alert('Submit job?', "This will notify the member that the job is complete.", [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => submit.mutate() },
      ]);
    }
  }

  const stepLabel = `Step ${step} of ${TOTAL_STEPS}`;

  return (
    <View style={styles.container}>
      <TopBar
        title={stepTitles[step - 1]}
        subtitle={stepLabel}
        leftAction="close"
        onClose={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1 — Activity Summary */}
        {step === 1 && (
          <GlassCard>
            <Text style={styles.fieldLabel}>DESCRIBE WORK DONE</Text>
            <TextInput
              style={styles.textarea}
              value={form.summary}
              onChangeText={(v) => setForm((f) => ({ ...f, summary: v }))}
              placeholder="Describe the work you completed in detail…"
              placeholderTextColor={colors.outline}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </GlassCard>
        )}

        {/* Step 2 — Invoice */}
        {step === 2 && (
          <GlassCard style={styles.invoiceCard}>
            <Text style={styles.fieldLabel}>INVOICE AMOUNT</Text>
            <View style={styles.invoiceRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.invoiceInput}
                value={form.invoice_amount}
                onChangeText={(v) => setForm((f) => ({ ...f, invoice_amount: v }))}
                placeholder="0.00"
                placeholderTextColor={colors.outline}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
          </GlassCard>
        )}

        {/* Step 3 — Benefits */}
        {step === 3 && (
          <GlassCard style={{ gap: spacing.md }}>
            <Text style={styles.fieldLabel}>MEMBER BENEFITS</Text>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>No call-out fee charged</Text>
              <TouchableOpacity
                style={[styles.toggle, form.callout_fee_waived && styles.toggleOn]}
                onPress={() => setForm((f) => ({ ...f, callout_fee_waived: !f.callout_fee_waived }))}
              >
                <View style={[styles.toggleThumb, form.callout_fee_waived && styles.toggleThumbOn]} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Member discount applied</Text>
              <TouchableOpacity
                style={[styles.toggle, form.discount_applied && styles.toggleOn]}
                onPress={() => setForm((f) => ({ ...f, discount_applied: !f.discount_applied }))}
              >
                <View style={[styles.toggleThumb, form.discount_applied && styles.toggleThumbOn]} />
              </TouchableOpacity>
            </View>

            {form.discount_applied && (
              <View>
                <Text style={styles.fieldLabel}>DISCOUNT AMOUNT</Text>
                <View style={styles.invoiceRow}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.invoiceInput}
                    value={form.discount_amount}
                    onChangeText={(v) => setForm((f) => ({ ...f, discount_amount: v }))}
                    placeholder="0.00"
                    placeholderTextColor={colors.outline}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            )}
          </GlassCard>
        )}

        {/* Step 4 — Photos */}
        {step === 4 && (
          <View>
            <Text style={styles.stepDesc}>Attach photos of completed work (optional but recommended)</Text>
            <View style={styles.photoGrid}>
              <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto}>
                <Plus size={24} color={colors.primary} />
                <Text style={styles.addPhotoText}>Add photo</Text>
              </TouchableOpacity>
              {form.photos.map((uri, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.thumbImg} />
                  <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(i)}>
                    <X size={12} color={colors.onSurface} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Step 5 — Review */}
        {step === 5 && (
          <View style={{ gap: spacing.md }}>
            <ReviewSection title="Activity summary" onEdit={() => setStep(1)}>
              <Text style={styles.reviewText}>{form.summary}</Text>
            </ReviewSection>

            <ReviewSection title="Invoice" onEdit={() => setStep(2)}>
              <Text style={styles.reviewText}>${parseFloat(form.invoice_amount || '0').toFixed(2)}</Text>
            </ReviewSection>

            <ReviewSection title="Benefits" onEdit={() => setStep(3)}>
              {form.callout_fee_waived && <BenefitBadge label="No call-out fee" />}
              {form.discount_applied && (
                <BenefitBadge label={`$${parseFloat(form.discount_amount || '0').toFixed(2)} discount`} />
              )}
              {!form.callout_fee_waived && !form.discount_applied && (
                <Text style={styles.reviewText}>No benefits applied</Text>
              )}
            </ReviewSection>

            {form.photos.length > 0 && (
              <ReviewSection title="Photos" onEdit={() => setStep(4)}>
                <View style={styles.reviewPhotoRow}>
                  {form.photos.map((uri, i) => (
                    <Image key={i} source={{ uri }} style={styles.reviewPhoto} />
                  ))}
                </View>
              </ReviewSection>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer nav */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <Button
          label={step === TOTAL_STEPS ? 'Submit' : 'Next'}
          onPress={handleNext}
          loading={submit.isPending}
          disabled={!canAdvance()}
          style={styles.nextBtn}
          fullWidth={step === 1}
        />
      </View>
    </View>
  );
}

function ReviewSection({
  title, onEdit, children,
}: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <GlassCard>
      <View style={rstyles.header}>
        <Text style={rstyles.title}>{title}</Text>
        <TouchableOpacity onPress={onEdit}>
          <Text style={rstyles.edit}>Edit</Text>
        </TouchableOpacity>
      </View>
      {children}
    </GlassCard>
  );
}

function BenefitBadge({ label }: { label: string }) {
  return (
    <View style={bstyles.badge}>
      <CheckCircle size={12} color={colors.primary} />
      <Text style={bstyles.label}>{label}</Text>
    </View>
  );
}

const stepTitles = ['Activity Summary', 'Invoice', 'Benefits', 'Photos', 'Review & Submit'];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md },
  fieldLabel: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.labelCaps,
    color: colors.onSurfaceVariant,
    letterSpacing: typography.letterSpacings.labelCaps,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  textarea: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  invoiceCard: { alignItems: 'center', paddingVertical: spacing.section },
  invoiceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  currencySymbol: {
    fontFamily: typography.fonts.bold,
    fontSize: 32,
    color: colors.primary,
  },
  invoiceInput: {
    fontFamily: typography.fonts.bold,
    fontSize: 48,
    color: colors.onSurface,
    borderBottomWidth: 2,
    borderBottomColor: `${colors.primary}50`,
    minWidth: 160,
    textAlign: 'center',
  },
  stepDesc: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  addPhotoBtn: {
    width: 100, height: 100, borderRadius: radii.xl,
    borderWidth: 1.5, borderColor: `${colors.primary}40`,
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs,
  },
  addPhotoText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.labelCaps,
    color: colors.primary,
  },
  photoThumb: { width: 100, height: 100, borderRadius: radii.xl, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  removePhoto: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  reviewText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurface,
  },
  reviewPhotoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reviewPhoto: { width: 72, height: 72, borderRadius: radii.lg },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: {
    fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyLg, color: colors.onSurface,
  },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center', padding: 2,
  },
  toggleOn: { backgroundColor: colors.primary },
  toggleThumb: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.outline,
  },
  toggleThumbOn: { alignSelf: 'flex-end', backgroundColor: colors.background },
  footer: {
    flexDirection: 'row', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
    backgroundColor: 'rgba(23,18,25,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: radii.full, borderWidth: 1, borderColor: colors.glassBorder,
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodySm, color: colors.onSurfaceVariant,
  },
  nextBtn: { flex: 1 },
});

const rstyles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodyLg, color: colors.onSurface },
  edit: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodySm, color: colors.primary },
});

const bstyles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radii.full, alignSelf: 'flex-start',
  },
  label: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.bodySm, color: colors.primaryLight },
});

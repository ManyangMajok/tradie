import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Star } from 'lucide-react-native';
import { GlassCard, Button, colors, typography, spacing } from '@tradify/ui';
import { apiError, memberApi } from '@tradify/shared';

export function ReviewFormScreen({ route, navigation }: any) {
  const { publicId } = route.params;
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [work, setWork] = useState<string | null>(null);
  const [callout, setCallout] = useState<boolean | null>(null);
  const [discount, setDiscount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || work === null || callout === null || discount === null) {
      Alert.alert('Required', 'Select a rating and confirm the completed work, call-out fee and discount.');
      return;
    }
    setLoading(true);
    try {
      await memberApi.reviewJob(publicId, { stars: rating, review_text: comment, work_completed_status: work, no_callout_fee_honoured: callout, discount_honoured: discount });
      Alert.alert('Success', 'Thank you for your feedback!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Leave a Review</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <X size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <GlassCard style={styles.card}>
          <Text style={styles.prompt}>How was the service?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                <Star size={40} color={star <= rating ? colors.warning : colors.outline} fill={star <= rating ? colors.warning : 'transparent'} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Was the work completed?</Text>
          {[['yes', 'Yes'], ['partial', 'Partially'], ['no', 'No']].map(([value, label]) => <Button key={value} label={label} variant={work === value ? 'primary' : 'secondary'} onPress={() => setWork(value)} />)}
          <Text style={styles.label}>Was the call-out fee waived?</Text>
          <Button label="Yes" variant={callout === true ? 'primary' : 'secondary'} onPress={() => setCallout(true)} />
          <Button label="No" variant={callout === false ? 'primary' : 'secondary'} onPress={() => setCallout(false)} />
          <Text style={styles.label}>Was the member discount honoured?</Text>
          {[['yes', 'Yes'], ['no', 'No'], ['na', 'Not applicable']].map(([value, label]) => <Button key={value} label={label} variant={discount === value ? 'primary' : 'secondary'} onPress={() => setDiscount(value)} />)}
          <Text style={styles.label}>COMMENTS (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            accessibilityLabel="Review comments"
            maxLength={1000}
            value={comment}
            onChangeText={setComment}
            placeholder="Tell us about your experience..."
            placeholderTextColor={colors.outline}
            multiline
            textAlignVertical="top"
          />

          <Button label="Submit Review" onPress={handleSubmit} loading={loading} style={styles.submitBtn} />
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  title: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  closeBtn: { position: 'absolute', right: spacing.md, bottom: spacing.sm, padding: spacing.sm },
  content: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center' },
  card: { gap: spacing.lg },
  prompt: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.h3, color: colors.onSurface, textAlign: 'center' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  starBtn: { padding: 4 },
  label: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.labelCaps, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  input: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyMd, color: colors.onSurface, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12, padding: spacing.md, height: 120, backgroundColor: `${colors.surface}50` },
  submitBtn: { marginTop: spacing.md },
});

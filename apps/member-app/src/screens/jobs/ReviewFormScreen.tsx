import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Star } from 'lucide-react-native';
import { GlassCard, Button, colors, typography, spacing } from '@tradify/ui';
import { memberApi } from '@tradify/shared';

export function ReviewFormScreen({ route, navigation }: any) {
  const { publicId } = route.params;
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Required', 'Please select a rating.');
      return;
    }
    setLoading(true);
    try {
      await memberApi.reviewJob(publicId, rating, comment);
      Alert.alert('Success', 'Thank you for your feedback!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Could not submit review.');
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

      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <GlassCard style={styles.card}>
          <Text style={styles.prompt}>How was the service?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                <Star size={40} color={star <= rating ? colors.warning : colors.outline} fill={star <= rating ? colors.warning : 'transparent'} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>COMMENTS (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Tell us about your experience..."
            placeholderTextColor={colors.outline}
            multiline
            textAlignVertical="top"
          />

          <Button label="Submit Review" onPress={handleSubmit} loading={loading} style={styles.submitBtn} />
        </GlassCard>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  title: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.h3, color: colors.onSurface },
  closeBtn: { position: 'absolute', right: spacing.md, bottom: spacing.sm, padding: spacing.sm },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  card: { gap: spacing.lg },
  prompt: { fontFamily: typography.fonts.semiBold, fontSize: typography.sizes.h3, color: colors.onSurface, textAlign: 'center' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  starBtn: { padding: 4 },
  label: { fontFamily: typography.fonts.bold, fontSize: typography.sizes.labelCaps, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  input: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.bodyMd, color: colors.onSurface, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12, padding: spacing.md, height: 120, backgroundColor: `${colors.surface}50` },
  submitBtn: { marginTop: spacing.md },
});

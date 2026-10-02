import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Modal, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Clock, Zap, ChevronUp, ChevronDown } from 'lucide-react-native';
import { TopBar, GlassCard, Button, colors, typography, spacing, radii } from '@tradify/ui';
import { client, type AvailabilitySlot, DAYS_OF_WEEK } from '@tradify/shared';
import type { RootStackParamList } from '../../navigation/RootNavigator';

// Stitch ref: docs/stitch/availability/ — spec §9.12

type Props = NativeStackScreenProps<RootStackParamList, 'Availability'>;

interface AvailabilityData {
  slots: AvailabilitySlot[];
  accept_emergency: boolean;
}

interface TimePickerState {
  slotIndex: number;
  field: 'start_time' | 'end_time';
  hour: number;
  minute: number;
}

const MINUTES = [0, 15, 30, 45];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(':').map(Number);
  return { hour: h, minute: m };
}

export function AvailabilityScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [acceptEmergency, setAcceptEmergency] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [picker, setPicker] = useState<TimePickerState | null>(null);

  const { data } = useQuery<AvailabilityData>({
    queryKey: ['availability'],
    queryFn: () => client.get('/api/v1/tradie/availability').then((r) => r.data),
  });

  useEffect(() => {
    if (data) {
      setSlots(data.slots);
      setAcceptEmergency(data.accept_emergency);
      setDirty(false);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      client.patch('/api/v1/tradie/availability', {
        slots,
        accept_emergency: acceptEmergency,
      }),
    onSuccess: () => {
      setDirty(false);
      navigation.goBack();
    },
  });

  function toggleDay(index: number) {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, is_available: !s.is_available } : s,
      ),
    );
    setDirty(true);
  }

  function openPicker(slotIndex: number, field: 'start_time' | 'end_time') {
    const t = parseTime(
      field === 'start_time' ? slots[slotIndex].start_time : slots[slotIndex].end_time,
    );
    setPicker({ slotIndex, field, ...t });
  }

  function commitPicker() {
    if (!picker) return;
    const { slotIndex, field, hour, minute } = picker;
    const value = `${pad(hour)}:${pad(minute)}`;

    const updated = slots.map((s, i) => {
      if (i !== slotIndex) return s;
      if (field === 'start_time') {
        const end = parseTime(s.end_time);
        if (hour > end.hour || (hour === end.hour && minute >= end.minute)) {
          Alert.alert('Invalid time', 'Open time must be before close time.');
          return s;
        }
        return { ...s, start_time: value };
      } else {
        const start = parseTime(s.start_time);
        if (hour < start.hour || (hour === start.hour && minute <= start.minute)) {
          Alert.alert('Invalid time', 'Close time must be after open time.');
          return s;
        }
        return { ...s, end_time: value };
      }
    });
    setSlots(updated);
    setDirty(true);
    setPicker(null);
  }

  function handleSave() {
    const anyAvailable = slots.some((s) => s.is_available) || acceptEmergency;
    if (!anyAvailable) {
      Alert.alert(
        'No availability',
        "You'll never receive leads. Enable at least one day or emergency.",
      );
      return;
    }
    save.mutate();
  }

  const dayLabels = DAYS_OF_WEEK;

  return (
    <View style={styles.container}>
      <TopBar
        title="Availability"
        leftAction="back"
        onBack={() => {
          if (dirty) {
            Alert.alert('Unsaved changes', 'Discard changes?', [
              { text: 'Keep editing', style: 'cancel' },
              { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
            ]);
          } else {
            navigation.goBack();
          }
        }}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Operating hours */}
        <GlassCard padding={0}>
          {slots.map((slot, i) => (
            <View key={slot.day}>
              <View style={styles.dayRow}>
                <Switch
                  value={slot.is_available}
                  onValueChange={() => toggleDay(i)}
                  thumbColor={colors.background}
                  trackColor={{ false: colors.surfaceContainer, true: colors.primary }}
                />
                <Text style={[styles.dayLabel, !slot.is_available && styles.dayLabelOff]}>
                  {dayLabels[slot.day]}
                </Text>
                {slot.is_available ? (
                  <View style={styles.timeRow}>
                    <TouchableOpacity
                      style={styles.timePill}
                      onPress={() => openPicker(i, 'start_time')}
                      accessibilityLabel={`${dayLabels[slot.day]} open time`}
                    >
                      <Clock size={12} color={colors.primary} />
                      <Text style={styles.timeText}>{slot.start_time}</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeSep}>–</Text>
                    <TouchableOpacity
                      style={styles.timePill}
                      onPress={() => openPicker(i, 'end_time')}
                      accessibilityLabel={`${dayLabels[slot.day]} close time`}
                    >
                      <Text style={styles.timeText}>{slot.end_time}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.closedLabel}>Closed</Text>
                )}
              </View>
              {i < slots.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassCard>

        {/* Emergency toggle */}
        <GlassCard style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <View style={styles.emergencyIconWrap}>
              <Zap size={18} color={colors.tertiary} />
            </View>
            <View style={styles.emergencyInfo}>
              <Text style={styles.emergencyTitle}>Accept emergency leads outside hours</Text>
              <Text style={styles.emergencyHint}>Emergency leads pay more, but you're on call.</Text>
            </View>
            <Switch
              value={acceptEmergency}
              onValueChange={(v) => { setAcceptEmergency(v); setDirty(true); }}
              thumbColor={colors.background}
              trackColor={{ false: colors.surfaceContainer, true: colors.tertiary }}
            />
          </View>
        </GlassCard>
      </ScrollView>

      {/* Save footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          label="Save Availability"
          onPress={handleSave}
          loading={save.isPending}
          disabled={!dirty}
          fullWidth
        />
      </View>

      {/* Time picker modal */}
      <Modal
        visible={picker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPicker(null)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>
              {picker?.field === 'start_time' ? 'Opening time' : 'Closing time'}
            </Text>

            <View style={styles.pickerBody}>
              {/* Hours */}
              <View style={styles.spinnerCol}>
                <TouchableOpacity
                  style={styles.spinBtn}
                  onPress={() => picker && setPicker({ ...picker, hour: (picker.hour + 1) % 24 })}
                >
                  <ChevronUp size={20} color={colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.spinValue}>{picker ? pad(picker.hour) : '00'}</Text>
                <TouchableOpacity
                  style={styles.spinBtn}
                  onPress={() => picker && setPicker({ ...picker, hour: (picker.hour + 23) % 24 })}
                >
                  <ChevronDown size={20} color={colors.onSurface} />
                </TouchableOpacity>
              </View>

              <Text style={styles.colon}>:</Text>

              {/* Minutes */}
              <View style={styles.spinnerCol}>
                <TouchableOpacity
                  style={styles.spinBtn}
                  onPress={() =>
                    picker &&
                    setPicker({
                      ...picker,
                      minute: MINUTES[(MINUTES.indexOf(picker.minute) + 1) % MINUTES.length],
                    })
                  }
                >
                  <ChevronUp size={20} color={colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.spinValue}>{picker ? pad(picker.minute) : '00'}</Text>
                <TouchableOpacity
                  style={styles.spinBtn}
                  onPress={() =>
                    picker &&
                    setPicker({
                      ...picker,
                      minute:
                        MINUTES[
                          (MINUTES.indexOf(picker.minute) + MINUTES.length - 1) % MINUTES.length
                        ],
                    })
                  }
                >
                  <ChevronDown size={20} color={colors.onSurface} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.pickerActions}>
              <TouchableOpacity style={styles.pickerCancel} onPress={() => setPicker(null)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerConfirm} onPress={commitPicker}>
                <Text style={styles.pickerConfirmText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  dayRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    gap: spacing.md,
  },
  dayLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
    width: 48,
  },
  dayLabelOff: { color: colors.outline },
  timeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'flex-end' },
  timePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  timeText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodySm,
    color: colors.primaryLight,
  },
  timeSep: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.outline,
  },
  closedLabel: {
    flex: 1, textAlign: 'right',
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.outline,
  },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginLeft: spacing.lg },
  emergencyCard: { gap: 0 },
  emergencyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emergencyIconWrap: {
    width: 40, height: 40, borderRadius: radii.lg,
    backgroundColor: `${colors.tertiary}20`,
    alignItems: 'center', justifyContent: 'center',
  },
  emergencyInfo: { flex: 1 },
  emergencyTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodyLg,
    color: colors.onSurface,
  },
  emergencyHint: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
    backgroundColor: 'rgba(23,18,25,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  pickerSheet: {
    width: 280, backgroundColor: colors.surface,
    borderRadius: radii.xxl, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  pickerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  pickerBody: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl,
  },
  spinnerCol: { alignItems: 'center', gap: spacing.sm },
  spinBtn: {
    width: 44, height: 44, borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  spinValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h1,
    color: colors.onSurface,
    width: 64, textAlign: 'center',
  },
  colon: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h1,
    color: colors.outline,
    paddingBottom: spacing.sm,
  },
  pickerActions: {
    flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl,
  },
  pickerCancel: {
    flex: 1, paddingVertical: spacing.md,
    borderRadius: radii.full, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  pickerCancelText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurfaceVariant,
  },
  pickerConfirm: {
    flex: 1, paddingVertical: spacing.md,
    borderRadius: radii.full, backgroundColor: colors.primary,
    alignItems: 'center',
  },
  pickerConfirmText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodySm,
    color: colors.background,
  },
});

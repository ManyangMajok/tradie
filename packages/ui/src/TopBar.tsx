import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, X } from 'lucide-react-native';
import { colors, typography, spacing } from './tokens';

interface Props {
  title?: string;
  onBack?: () => void;
  onClose?: () => void;
  right?: React.ReactNode;
  /** 'back' shows ←, 'close' shows ✕, undefined shows nothing */
  leftAction?: 'back' | 'close';
  subtitle?: string;
}

export function TopBar({ title, onBack, onClose, right, leftAction, subtitle }: Props) {
  const insets = useSafeAreaInsets();

  const handleLeft = leftAction === 'close' ? onClose : onBack;
  const LeftIcon = leftAction === 'close' ? X : ArrowLeft;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.row}>
        <View style={styles.side}>
          {leftAction && handleLeft && (
            <TouchableOpacity onPress={handleLeft} style={styles.iconBtn} hitSlop={8}>
              <LeftIcon size={22} color={colors.onSurface} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.center}>
          {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>

        <View style={styles.side}>
          {right}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(60, 53, 65, 0.8)',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  side: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  iconBtn: {
    padding: spacing.xs,
  },
  title: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.bodySm,
    color: colors.onSurface,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
});

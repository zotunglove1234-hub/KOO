import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export function Rating({ value, reviews, compact = false }: { value: number; reviews?: number; compact?: boolean }) {
  return (
    <View style={styles.row}>
      <Ionicons color={colors.star} name="star" size={compact ? 12 : 14} />
      <Text style={[styles.value, compact && styles.valueCompact]}>{value.toFixed(1)}</Text>
      {reviews !== undefined && !compact ? <Text style={styles.count}>({reviews.toLocaleString()})</Text> : null}
    </View>
  );
}

type TagTone = 'brand' | 'neutral' | 'success' | 'danger';

const toneStyles: Record<TagTone, { bg: string; fg: string }> = {
  brand: { bg: '#FFEDD5', fg: '#9A3412' },
  neutral: { bg: '#EEF2F7', fg: colors.inkSoft },
  success: { bg: '#DCFCE7', fg: '#15803D' },
  danger: { bg: '#FEE2E2', fg: '#B91C1C' },
};

export function Tag({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: TagTone;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const palette = toneStyles[tone];
  return (
    <View style={[styles.tag, { backgroundColor: palette.bg }]}>
      {icon ? <Ionicons color={palette.fg} name={icon} size={12} style={styles.tagIcon} /> : null}
      <Text style={[styles.tagLabel, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function InfoRow({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  trailing?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      android_ripple={{ color: 'rgba(11,17,32,0.06)' }}
      onPress={onPress}
      style={({ pressed }) => [styles.infoRow, onPress && styles.infoRowInteractive, pressed && styles.pressed]}>
      <View style={[styles.infoIconWrap, { backgroundColor: toneStyles.neutral.bg }]}>
        <Ionicons color={colors.inkSoft} name={icon} size={18} />
      </View>
      <View style={styles.infoBody}>
        <Text style={styles.infoTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.infoSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <Text style={styles.infoTrailing}>{trailing}</Text> : null}
      {onPress ? <Ionicons color={colors.faint} name="chevron-forward" size={18} style={styles.chevron} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  value: { fontSize: 13, fontWeight: '700', color: colors.ink },
  valueCompact: { fontSize: 12 },
  count: { fontSize: 12, fontWeight: '500', color: colors.muted },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  tagIcon: { marginRight: 4 },
  tagLabel: { fontSize: 11, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  infoRowInteractive: { cursor: 'pointer' },
  pressed: { opacity: 0.7 },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBody: { flex: 1 },
  infoTitle: { ...typography.bodyStrong },
  infoSubtitle: { ...typography.caption, marginTop: 2 },
  infoTrailing: { fontSize: 13, fontWeight: '600', color: colors.muted },
  chevron: { marginLeft: spacing.xs },
});

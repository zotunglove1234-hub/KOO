import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

type Props = {
  qty: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  label?: string;
};

export function QtyStepper({ qty, onChange, min = 1, max = 10, size = 'md', label }: Props) {
  const t = useT();
  const dimension = size === 'sm' ? 30 : 38;
  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.group, size === 'sm' && styles.groupSmall]}>
        <StepperButton
          disabled={qty <= min}
          icon="remove"
          label={t.bits.decreaseQtyA11y}
          onPress={() => onChange(qty - 1)}
          size={dimension}
          iconSize={iconSize}
        />
        <Text style={[styles.value, size === 'sm' && styles.valueSmall]} accessibilityLiveRegion="polite">
          {qty}
        </Text>
        <StepperButton
          disabled={qty >= max}
          icon="add"
          label={t.bits.increaseQtyA11y}
          onPress={() => onChange(qty + 1)}
          size={dimension}
          iconSize={iconSize}
        />
      </View>
    </View>
  );
}

function StepperButton({
  icon,
  label,
  onPress,
  disabled,
  size,
  iconSize,
}: {
  icon: 'add' | 'remove';
  label: string;
  onPress: () => void;
  disabled: boolean;
  size: number;
  iconSize: number;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      android_ripple={{ color: 'rgba(11,17,32,0.08)', borderless: true }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { width: size }, pressed && !disabled && styles.pressed]}>
      <Ionicons color={disabled ? colors.faint : colors.ink} name={icon} size={iconSize} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  groupSmall: { borderRadius: radius.sm },
  button: { height: '100%', minHeight: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  pressed: { backgroundColor: '#F1F5F9' },
  value: {
    minWidth: 34,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.sm,
  },
  valueSmall: { minWidth: 28, fontSize: 14, paddingVertical: 5 },
});

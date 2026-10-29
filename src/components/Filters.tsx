import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useT } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';

export function SearchField({
  value,
  onChange,
  placeholder,
  onSubmit,
  autoFocus = false,
  onPress,
}: {
  value: string;
  onChange?: (next: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  /** When set the field renders as a button — used on Home to jump to the Search tab. */
  onPress?: () => void;
}) {
  const t = useT();
  const hint = placeholder ?? t.bits.searchPlaceholder;

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hint}
        android_ripple={{ color: 'rgba(11,17,32,0.05)' }}
        onPress={onPress}
        style={styles.field}>
        <Ionicons color={colors.muted} name="search" size={18} style={styles.fieldIcon} />
        <Text numberOfLines={1} style={styles.placeholder}>
          {hint}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.field}>
      <Ionicons color={colors.muted} name="search" size={18} style={styles.fieldIcon} />
      <TextInput
        accessibilityLabel={t.bits.searchA11y}
        autoFocus={autoFocus}
        keyboardAppearance="light"
        multiline={false}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={hint}
        placeholderTextColor={colors.faint}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel={t.bits.clearSearchA11y}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => onChange?.('')}
          style={styles.clear}>
          <Ionicons color={colors.muted} name="close-circle" size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

export type ChipOption<T extends string> = {
  id: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function ChipRow<T extends string>({
  options,
  selected,
  onSelect,
  style,
}: {
  options: ChipOption<T>[];
  selected: T;
  onSelect: (id: T) => void;
  style?: object;
}) {
  return (
    <ScrollView
      contentContainerStyle={[styles.chipRow, style]}
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}>
      {options.map((option) => {
        const active = option.id === selected;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            android_ripple={{ color: 'rgba(255,255,255,0.28)' }}
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={[styles.chip, active && styles.chipActive]}>
            {option.icon ? (
              <Ionicons color={active ? colors.white : colors.muted} name={option.icon} size={15} style={styles.chipIcon} />
            ) : null}
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Ionicons color={colors.brand} name={icon} size={28} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    gap: spacing.sm,
  },
  fieldIcon: { marginRight: 2 },
  input: { ...typography.body, flex: 1, color: colors.ink, paddingVertical: spacing.sm },
  placeholder: { ...typography.body, flex: 1, color: colors.faint },
  clear: { paddingVertical: spacing.sm },
  chipRow: { gap: spacing.sm, paddingVertical: 2, paddingRight: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipIcon: { marginRight: 6 },
  chipLabel: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  chipLabelActive: { color: colors.white },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.title },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 2, paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { ...typography.subtitle },
  emptyBody: { ...typography.caption, textAlign: 'center', lineHeight: 19 },
  emptyAction: { marginTop: spacing.md },
});

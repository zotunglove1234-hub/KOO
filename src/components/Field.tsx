import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type FieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
  /** Rendered under the input when there is no error — hints, not blockers. */
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * One labelled input for every form in the app (login, register, chat draft).
 *
 * `accessibilityLabel` is set to the visible label so a screen reader announces
 * the field even when the placeholder is empty, and the error text is a sibling
 * of the input rather than a placeholder colour change — colour alone is not an
 * accessible signal.
 */
export function Field({ label, error, hint, containerStyle, ...inputProps }: FieldProps) {
  return (
    <View style={containerStyle}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.faint}
        style={[styles.input, error ? styles.inputError : null]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.caption, fontSize: 12.5, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.ink,
  },
  inputError: { borderColor: colors.danger },
  error: { ...typography.caption, color: colors.danger, marginTop: 6, lineHeight: 17 },
  hint: { ...typography.caption, fontSize: 12, lineHeight: 17, marginTop: 6 },
});

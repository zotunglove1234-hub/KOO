import { StyleSheet, Text, View } from 'react-native';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SectionHeader } from '@/components/Filters';
import { Screen, ScreenHeader } from '@/components/Screen';
import { useI18n } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';

export default function SettingsScreen() {
  const { t, isDeviceDefault, lang, deviceLang } = useI18n();

  return (
    <Screen>
      <ScreenHeader back subtitle={t.settings.subtitle} title={t.settings.title} />

      <SectionHeader title={t.settings.languageSection} />
      <View style={styles.card}>
        <Text style={styles.description}>{t.settings.languageDescription}</Text>
        <LanguageSwitcher allowFollowDevice />
        <Text style={styles.status}>
          {isDeviceDefault
            ? t.settings.followingDevice(t.langLabel[deviceLang])
            : t.settings.manualChoice(t.langLabel[lang])}
        </Text>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>{t.settings.note}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.md,
  },
  description: { ...typography.caption, fontSize: 13, lineHeight: 19 },
  status: { ...typography.tiny },
  note: {
    marginTop: spacing.lg,
    backgroundColor: '#F0FDF4',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: { fontSize: 12.5, lineHeight: 18, color: '#166534', fontWeight: '500' },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LANGS, useI18n, type Lang } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  /** Show the "follow device language" reset under the options (Settings screen). */
  allowFollowDevice?: boolean;
  /** Tighter row height for embedding inside a card, e.g. on Account. */
  compact?: boolean;
};

/**
 * Segmented မြန်မာ / English control. Language names are rendered in their own
 * script on purpose — that stays readable whichever language is active.
 */
export function LanguageSwitcher({ allowFollowDevice = false, compact = false }: Props) {
  const { lang, setLang, isDeviceDefault, followDevice, deviceLang, t } = useI18n();

  return (
    <View style={styles.wrapper}>
      <View accessibilityRole="radiogroup" style={styles.group}>
        {LANGS.map((code: Lang) => {
          const active = code === lang;
          return (
            <Pressable
              accessibilityLabel={t.langLabel[code]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              android_ripple={{ color: active ? 'rgba(255,255,255,0.2)' : 'rgba(11,17,32,0.06)' }}
              key={code}
              onPress={() => setLang(code)}
              style={[styles.option, compact && styles.optionCompact, active && styles.optionActive]}>
              <Text style={[styles.label, compact && styles.labelCompact, active && styles.labelActive]}>
                {t.langLabel[code]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {allowFollowDevice ? (
        <Pressable
          android_ripple={{ color: 'rgba(11,17,32,0.06)' }}
          disabled={isDeviceDefault}
          hitSlop={6}
          onPress={followDevice}
          style={({ pressed }) => [styles.followRow, isDeviceDefault && styles.followRowDisabled, pressed && !isDeviceDefault && styles.pressed]}>
          <Text style={styles.followText}>
            {isDeviceDefault
              ? t.settings.followingDevice(t.langLabel[deviceLang])
              : t.settings.followDevice}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  group: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  option: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  optionCompact: { minHeight: 38 },
  optionActive: { backgroundColor: colors.ink },
  label: { ...typography.bodyStrong, fontSize: 14 },
  labelCompact: { fontSize: 13 },
  labelActive: { color: colors.white },
  followRow: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  followRowDisabled: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
  followText: { ...typography.caption, color: colors.brandDark, fontWeight: '700' },
});

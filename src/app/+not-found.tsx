import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';

export default function NotFoundScreen() {
  const t = useT();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.brand} name="compass-outline" size={30} />
      </View>
      <Text style={styles.title}>{t.notFound.title}</Text>
      <Text style={styles.body}>{t.notFound.body}</Text>
      <Link asChild href="/">
        <Pressable android_ripple={{ color: 'rgba(255,255,255,0.24)' }} style={styles.button}>
          <Text style={styles.buttonLabel}>{t.notFound.goHome}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.canvas,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.title, textAlign: 'center' },
  body: { ...typography.caption, textAlign: 'center', lineHeight: 19 },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { color: colors.white, fontSize: 15, fontWeight: '800' },
});

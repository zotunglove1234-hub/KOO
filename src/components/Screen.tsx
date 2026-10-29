import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactElement, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { colors, spacing, typography } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  /** Pass false when the screen renders its own FlatList. */
  scroll?: boolean;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Bottom padding beyond insets — used by tab screens so the tab bar never overlaps. */
  bottomGap?: number;
  /** Passed straight to the inner ScrollView, for pull-to-refresh screens. */
  refreshControl?: ReactElement;
};

export function Screen({ children, scroll = true, footer, contentContainerStyle, bottomGap = spacing.lg, refreshControl }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          refreshControl={refreshControl}
          style={styles.body}
          contentContainerStyle={[styles.content, { paddingBottom: bottomGap }, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, styles.fill]}>{children}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>{footer}</View>
      ) : null}
    </SafeAreaView>
  );
}

type HeaderProps = {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, back = false, right }: HeaderProps) {
  const t = useT();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {back ? (
          <Ionicons
            accessibilityRole="button"
            accessibilityLabel={t.common.goBack}
            hitSlop={12}
            name="chevron-back"
            onPress={() => router.back()}
            size={26}
            style={styles.back}
            color={colors.ink}
          />
        ) : null}
        <View style={styles.headerText}>
          <Text style={typography.display} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  body: { flex: 1 },
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRight: { marginLeft: spacing.sm },
  headerText: { flex: 1, marginLeft: spacing.sm },
  back: { alignSelf: 'center' },
  subtitle: { ...typography.caption, marginTop: 2 },
});

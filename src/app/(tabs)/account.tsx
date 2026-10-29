import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InfoRow, Tag } from '@/components/Bits';
import { Button } from '@/components/Button';
import { EmptyState, SectionHeader } from '@/components/Filters';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Screen, ScreenHeader } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { pastOrders, type OrderSummary } from '@/data/catalog';
import { localizeHeadline, localizeStatus, useI18n, type Dictionary } from '@/i18n';
import { listConversations } from '@/lib/chat';
import { formatDate, formatPrice } from '@/lib/format';
import { listOrders, orderHeadline, summaryFromOrder, type PlacedOrder } from '@/lib/orders';
import { displayNameFor } from '@/lib/profile';
import { colors, radius, spacing, typography } from '@/theme';

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const statusTone: Record<OrderSummary['status'], 'success' | 'brand' | 'neutral'> = {
  Delivered: 'success',
  'In transit': 'brand',
  Preparing: 'neutral',
};

export default function AccountScreen() {
  const { totals } = useCart();
  const { configured, profile, profileReason, signOut, status, user } = useAuth();
  const { t, lang, isDeviceDefault, deviceLang } = useI18n();
  const [placed, setPlaced] = useState<PlacedOrder[]>([]);
  /** Thread count tagged with the account it belongs to, so signing out or switching
   *  accounts never shows the previous user's inbox size. */
  const [threads, setThreads] = useState<{ userId: string; count: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    listOrders().then((orders) => {
      if (!cancelled) setPlaced(orders);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Threads only exist server-side, so the inbox count is fetched lazily and a
  // failure simply leaves the number out rather than showing a wrong one.
  useEffect(() => {
    if (!configured || !user) return;
    let cancelled = false;
    listConversations(user).then((result) => {
      if (!cancelled && result.ok) setThreads({ count: result.data.length, userId: user.id });
    });
    return () => {
      cancelled = true;
    };
  }, [configured, user]);

  const signedIn = status === 'signedIn' && Boolean(user);
  const threadCount = signedIn && threads && user && threads.userId === user.id ? threads.count : null;
  const displayName = signedIn ? displayNameFor(profile, user) : t.account.signedOutTitle;
  const displayEmail = signedIn ? profile?.email || user?.email || '' : t.account.signedOutHint;
  /** Only real join dates: the row's own `created_at`, written by Supabase. */
  const memberSince = signedIn && profile ? formatDate(profile.createdAt, t.dates) : null;

  const placedSummaries = useMemo(() => placed.map((order) => summaryFromOrder(order, t)), [placed, t]);
  /**
   * Signed-in shoppers see only orders they actually placed on this device.
   * The seeded list is a storefront preview for visitors, so it stays visible but
   * is labelled as demo data instead of pretending to be a history.
   */
  const orderHistory = useMemo(
    () => (signedIn ? placedSummaries : [...placedSummaries, ...pastOrders]),
    [signedIn, placedSummaries]
  );
  const placedIds = useMemo(() => new Set(placed.map((order) => order.id)), [placed]);

  return (
    <Screen>
      <ScreenHeader subtitle={t.home.locationCity} title={t.account.title} />

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          {signedIn ? (
            <Text style={styles.avatarText}>{initials(displayName)}</Text>
          ) : (
            <Ionicons color={colors.brand} name="person-outline" size={24} />
          )}
        </View>
        <View style={styles.profileBody}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>
          {signedIn ? (
            <View style={styles.badgeRow}>
              <Link asChild href="/profile">
                <Pressable accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.editRow, pressed && styles.pressed]}>
                  <Ionicons color={colors.brandDark} name="person-circle-outline" size={15} />
                  <Text style={styles.editRowText}>{t.account.editProfile}</Text>
                </Pressable>
              </Link>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => void signOut()}
                style={({ pressed }) => [styles.signOutRow, pressed && styles.pressed]}>
                <Ionicons color={colors.muted} name="log-out-outline" size={15} />
                <Text style={styles.signOutText}>{t.auth.signOut}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {signedIn && memberSince ? (
        <Text style={styles.joined}>{t.account.memberSince(memberSince)}</Text>
      ) : null}

      {/* A profile the app could not read is worth saying out loud: without the
          `koo_profiles` table the card silently falls back to the email local
          part, which looks like invented data. */}
      {signedIn && profileReason ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            {profileReason === 'missingTables'
              ? t.account.profileMissingTables
              : profileReason === 'offline'
                ? t.account.profileOffline
                : t.account.profileFailed}
          </Text>
        </View>
      ) : null}

      {signedIn ? null : (
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>{t.account.signInTitle}</Text>
          <Text style={styles.authBody}>{t.account.signInBody}</Text>
          <Button
            label={t.auth.signInCta}
            onPress={() => router.push('/login')}
            testID="account-sign-in"
            disabled={!configured}
          />
          <Button
            label={t.auth.signUpCta}
            onPress={() => router.push('/register')}
            testID="account-sign-up"
            variant="secondary"
            disabled={!configured}
          />
          {configured ? null : <Text style={styles.authNote}>{t.account.authUnavailable}</Text>}
        </View>
      )}

      {/* Every number here is measured, not seeded: orders actually placed on this
          device, the real cart size, and the live thread count once it loads. */}
      <View style={styles.statsRow}>
        <Stat label={t.account.stat.orders} value={String(placed.length)} />
        <Stat label={t.account.stat.inCart} value={String(totals.itemCount)} />
        <Stat label={t.account.stat.messages} value={threadCount === null ? '—' : String(threadCount)} />
      </View>

      <SectionHeader
        action={
          <View style={styles.orderActions}>
            {signedIn ? null : <Tag label={t.account.demoTag} tone="neutral" />}
            <Link href="/search" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.seeAll}>{t.account.browseCatalog}</Text>
              </Pressable>
            </Link>
          </View>
        }
        title={t.account.recentOrders}
      />

      {orderHistory.length === 0 ? (
        <EmptyState
          body={t.account.ordersEmptyBody}
          icon="receipt-outline"
          title={t.account.ordersEmptyTitle}
        />
      ) : (
        <View style={styles.ordersCard}>
          {orderHistory.slice(0, 5).map((order, index) => {
            const isTrackable = placedIds.has(order.id);
            const headline =
              (isTrackable ? orderHeadlineFromPlaced(placed, order.id, t) : undefined) ??
              localizeHeadline(order.headline, t);
            const inner = (
              <View key={order.id} style={[styles.orderRow, index > 0 && styles.orderRowBorder]}>
                <View style={styles.orderHead}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Tag label={localizeStatus(order.status, t)} tone={statusTone[order.status]} />
                </View>
                <Text numberOfLines={1} style={styles.orderHeadline}>
                  {headline}
                </Text>
                <View style={styles.orderFoot}>
                  <Text style={styles.orderMeta}>
                    {t.account.orderMeta(formatDate(order.placedAt, t.dates), order.items)}
                  </Text>
                  <Text style={styles.orderTotal}>{formatPrice(order.totalCents)}</Text>
                </View>
                {isTrackable ? (
                  <Text style={styles.orderCta}>{t.account.trackOrder}</Text>
                ) : null}
              </View>
            );

            if (!isTrackable) return inner;

            return (
              <Link key={order.id} asChild href={{ params: { id: order.id }, pathname: '/order/[id]' }}>
                <Pressable android_ripple={{ color: 'rgba(11,17,32,0.05)' }}>{inner}</Pressable>
              </Link>
            );
          })}
        </View>
      )}

      <SectionHeader title={t.settings.languageSection} />
      <View style={styles.settingsCard}>
        <View style={styles.languageRow}>
          <View style={styles.languageText}>
            <Text style={styles.languageTitle}>{t.account.languageTitle}</Text>
            <Text style={styles.languageNote}>
              {isDeviceDefault
                ? `${t.account.languageDevice}${t.common.bullet}${t.langLabel[deviceLang]}`
                : t.langLabel[lang]}
            </Text>
          </View>
        </View>
        <View style={styles.languageSwitch}>
          <LanguageSwitcher compact />
        </View>
      </View>

      <SectionHeader title={t.account.preferences} />
      <View style={styles.settingsCard}>
        <Link asChild href="/chat">
          <Pressable android_ripple={{ color: 'rgba(11,17,32,0.06)' }}>
            <InfoRow
              icon="chatbubbles-outline"
              subtitle={
                signedIn
                  ? threadCount === null
                    ? t.chat.title
                    : t.chat.threadCount(threadCount)
                  : t.account.signedOutHint
              }
              title={t.chat.title}
              trailing={signedIn ? undefined : t.auth.signInCta}
            />
          </Pressable>
        </Link>
        {/* Delivery details now come from the saved profile, so this row goes to
            the same form instead of quoting a seeded address. */}
        {signedIn ? (
          <Link asChild href="/profile">
            <Pressable android_ripple={{ color: 'rgba(11,17,32,0.06)' }}>
              <InfoRow
                icon="location-outline"
                subtitle={profile?.city || t.account.addressMissing}
                title={t.checkout.deliveryAddress}
                trailing={t.common.edit}
              />
            </Pressable>
          </Link>
        ) : (
          <InfoRow
            icon="location-outline"
            subtitle={t.account.signInToSave}
            title={t.checkout.deliveryAddress}
          />
        )}
        <InfoRow
          icon="card-outline"
          subtitle={t.account.paymentSubtitle}
          title={t.account.paymentMethodsTitle}
        />
        <InfoRow icon="notifications-outline" title={t.account.notificationsTitle} />
        <InfoRow icon="shield-checkmark-outline" title={t.account.privacyTitle} />
        <InfoRow icon="help-circle-outline" title={t.account.helpCentre} />
        <Link asChild href="/settings">
          <Pressable android_ripple={{ color: 'rgba(11,17,32,0.06)' }}>
            <InfoRow icon="settings-outline" title={t.settings.title} trailing={t.langLabel[lang]} />
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

function orderHeadlineFromPlaced(orders: PlacedOrder[], id: string, t: Dictionary): string | undefined {
  const order = orders.find((item) => item.id === id);
  return order ? orderHeadline(order, t) : undefined;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.brand, fontSize: 20, fontWeight: '900' },
  profileBody: { flex: 1, gap: 2 },
  profileName: { ...typography.subtitle, fontSize: 17 },
  profileEmail: { ...typography.caption, marginTop: 1 },
  badgeRow: { marginTop: spacing.xs },
  signOutRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs, alignSelf: 'flex-start', paddingVertical: 2 },
  signOutText: { ...typography.caption, color: colors.brandDark, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 2 },
  editRowText: { ...typography.caption, color: colors.brandDark, fontWeight: '700' },
  notice: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radius.md,
    borderStyle: 'solid',
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  noticeText: { ...typography.caption, color: '#7C2D12' },
  authCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  authTitle: { ...typography.subtitle, fontSize: 16 },
  authBody: { ...typography.caption, marginBottom: spacing.xs },
  authNote: { ...typography.tiny, textAlign: 'center' },
  orderActions: { alignItems: 'flex-end', gap: 4 },
  statsRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '900', color: colors.ink },
  statLabel: { ...typography.tiny },
  seeAll: { ...typography.caption, color: colors.brandDark, fontWeight: '700' },
  ordersCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  orderRow: { padding: spacing.lg, gap: 6 },
  orderRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  orderHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { ...typography.bodyStrong, letterSpacing: 0.4 },
  orderHeadline: { ...typography.caption },
  orderFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  orderMeta: { ...typography.tiny },
  orderTotal: { fontSize: 15, fontWeight: '800', color: colors.ink },
  orderCta: { fontSize: 12, fontWeight: '800', color: colors.brandDark, marginTop: spacing.xs },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  languageText: { flex: 1 },
  languageTitle: { ...typography.bodyStrong },
  languageNote: { ...typography.caption, marginTop: 2 },
  languageSwitch: { paddingBottom: spacing.md },
  joined: { ...typography.tiny, marginTop: spacing.sm },
});
